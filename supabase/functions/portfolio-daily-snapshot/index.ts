// @ts-nocheck -- This file runs in Supabase's Deno runtime, not the Next.js Node runtime.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildDailySnapshot, buildOpeningBaseline } from './core.ts';
import { fetchDailyClose, resolveDailyPrice } from './quotes.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
});

const shanghaiDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now);

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret || request.headers.get('x-cron-secret') !== cronSecret) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Missing Supabase service configuration' }, 500);
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const snapshotDate = shanghaiDate();

  const { data: openings, error: openingError } = await supabase.from('portfolio_openings').select('*');
  if (openingError) return json({ error: openingError.message }, 500);
  if (!openings?.length) return json({ date: snapshotDate, users: 0, complete: 0, partial: 0, failed: 0 });
  const userIds = openings.map((opening) => opening.user_id);

  const [openingPositionsResult, transactionsResult, tickersResult, historyResult] = await Promise.all([
    supabase.from('portfolio_opening_positions').select('*').in('user_id', userIds),
    supabase.from('transactions').select('user_id,ticker_id,type,quantity,amount_usd,trade_date').in('user_id', userIds).lte('trade_date', snapshotDate),
    supabase.from('tickers').select('id,user_id,name,code,type,currency,current_price,price_updated_at').in('user_id', userIds),
    supabase.from('nav_history').select('*').in('user_id', userIds).lt('date', snapshotDate).order('date', { ascending: false }),
  ]);
  const queryError = openingPositionsResult.error || transactionsResult.error || tickersResult.error || historyResult.error;
  if (queryError) return json({ error: queryError.message }, 500);

  const tickers = tickersResult.data ?? [];
  const resolvedPrices = new Map<string, Awaited<ReturnType<typeof resolveDailyPrice>>>();
  await Promise.all(tickers.map(async (ticker) => {
    const scheduledTicker = {
      id: ticker.id, code: ticker.code, type: ticker.type, currency: ticker.currency,
      currentPriceUsd: ticker.current_price == null ? null : Number(ticker.current_price),
      priceUpdatedAt: ticker.price_updated_at,
    };
    const price = await resolveDailyPrice(scheduledTicker);
    resolvedPrices.set(ticker.id, price);
    if (price && !price.fallback) {
      await supabase.from('tickers').update({
        current_price: price.priceUsd,
        price_updated_at: price.observedOn ?? snapshotDate,
      }).eq('id', ticker.id).eq('user_id', ticker.user_id);
    }
  }));

  const spyTicker = { id: 'SPY', code: 'SPY', type: 'stock_us', currency: 'USD', currentPriceUsd: null, priceUpdatedAt: null } as const;
  const spyQuote = await fetchDailyClose(spyTicker);
  const benchmarkPrice = spyQuote.ok ? spyQuote.priceNative : null;
  const latestByUser = new Map<string, Record<string, unknown>>();
  for (const row of historyResult.data ?? []) if (!latestByUser.has(row.user_id)) latestByUser.set(row.user_id, row);

  const results: Array<{ userId: string; status: 'complete' | 'partial' | 'failed'; errors?: string[] }> = [];
  for (const openingRow of openings) {
    const userId = openingRow.user_id;
    const userOpeningPositions = (openingPositionsResult.data ?? []).filter((position) => position.user_id === userId);
    const opening = {
      openingDate: openingRow.opening_date,
      openingCash: Number(openingRow.opening_cash),
      positions: userOpeningPositions.map((position) => ({
        tickerId: position.ticker_id,
        quantity: Number(position.quantity),
        openingMarketValueUsd: Number(position.opening_market_value_usd),
      })),
    };
    let previous = latestByUser.get(userId) as Record<string, unknown> | undefined;
    if (!previous && opening.openingDate < snapshotDate) {
      const baseline = buildOpeningBaseline(opening);
      const { data } = await supabase.from('nav_history').upsert({
        user_id: userId, date: baseline.date, total_assets: baseline.totalAssets,
        cash_balance: baseline.cashBalance, market_value: baseline.marketValue,
        external_flow: 0, nav: baseline.nav, shares: baseline.shares,
        valuation_status: 'complete', price_errors: [], updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' }).select().single();
      previous = data ?? { user_id: userId, ...baseline };
    }

    const userTickers = tickers.filter((ticker) => ticker.user_id === userId);
    const prices = Object.fromEntries(userTickers.flatMap((ticker) => {
      const price = resolvedPrices.get(ticker.id);
      return price ? [[ticker.id, price]] : [];
    }));
    const transactions = (transactionsResult.data ?? []).filter((transaction) => transaction.user_id === userId).map((transaction) => ({
      date: transaction.trade_date, type: transaction.type, tickerId: transaction.ticker_id,
      quantity: transaction.quantity == null ? null : Number(transaction.quantity),
      amountUsd: Number(transaction.amount_usd ?? 0),
    }));
    const previousSnapshot = previous ? {
      date: String(previous.date), totalAssets: Number(previous.total_assets ?? previous.totalAssets),
      cashBalance: Number(previous.cash_balance ?? previous.cashBalance), marketValue: Number(previous.market_value ?? previous.marketValue),
      externalFlow: Number(previous.external_flow ?? previous.externalFlow ?? 0), shares: Number(previous.shares), nav: Number(previous.nav),
      valuationStatus: previous.valuation_status ?? previous.valuationStatus ?? 'complete', priceErrors: previous.price_errors ?? previous.priceErrors ?? [],
    } : null;
    const built = buildDailySnapshot({ date: snapshotDate, opening, transactions, prices, previous: previousSnapshot });
    if (!built.ok) {
      results.push({ userId, status: 'failed', errors: built.errors });
      continue;
    }

    const previousBenchmarkPrice = previous ? Number(previous.benchmark_price || 0) : 0;
    const previousBenchmarkNav = previous ? Number(previous.benchmark_nav || 0) : 0;
    const benchmarkNav = benchmarkPrice
      ? previousBenchmarkPrice > 0 && previousBenchmarkNav > 0 ? previousBenchmarkNav * benchmarkPrice / previousBenchmarkPrice : 1
      : null;
    const snapshot = built.snapshot;
    const { error: snapshotError } = await supabase.from('nav_history').upsert({
      user_id: userId, date: snapshot.date, total_assets: snapshot.totalAssets,
      cash_balance: snapshot.cashBalance, market_value: snapshot.marketValue,
      external_flow: snapshot.externalFlow, nav: snapshot.nav, shares: snapshot.shares,
      valuation_status: snapshot.valuationStatus, price_errors: snapshot.priceErrors,
      benchmark_price: benchmarkPrice, benchmark_nav: benchmarkNav, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' });
    if (snapshotError) {
      results.push({ userId, status: 'failed', errors: [snapshotError.message] });
      continue;
    }

    await supabase.from('portfolio_position_snapshots').delete().eq('user_id', userId).eq('snapshot_date', snapshotDate);
    if (built.positions.length > 0) {
      const tickerMap = new Map(userTickers.map((ticker) => [ticker.id, ticker]));
      const { error: positionError } = await supabase.from('portfolio_position_snapshots').insert(built.positions.map((position) => ({
        user_id: userId, snapshot_date: snapshotDate, ticker_id: position.tickerId,
        ticker_name: tickerMap.get(position.tickerId)?.name ?? position.tickerId,
        ticker_code: tickerMap.get(position.tickerId)?.code ?? position.tickerId,
        quantity: position.quantity, price_usd: position.priceUsd, market_value_usd: position.marketValueUsd,
        price_source: position.priceSource, price_date: position.priceDate, used_fallback: position.usedFallback,
      })));
      if (positionError) {
        results.push({ userId, status: 'failed', errors: [positionError.message] });
        continue;
      }
    }
    results.push({ userId, status: snapshot.valuationStatus });
  }

  return json({
    date: snapshotDate,
    users: results.length,
    complete: results.filter((result) => result.status === 'complete').length,
    partial: results.filter((result) => result.status === 'partial').length,
    failed: results.filter((result) => result.status === 'failed').length,
    results,
  });
});
