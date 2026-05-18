import { NextResponse } from 'next/server';

/**
 * GET /api/spy?start=YYYY-MM-DD
 *
 * 获取标普500（SPY）历史日线数据（东方财富 API，国内可直接访问）
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');

  if (!start) {
    return NextResponse.json({ error: '缺少 start 参数' }, { status: 400 });
  }

  // 东方财富 secid: SPY 在 AMEX 交易所，搜索确认用 107 前缀
  const secId = '107.SPY';
  const beg = start.replace(/-/g, '');
  const end = new Date().toISOString().split('T')[0].replace(/-/g, '');

  try {
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secId}&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&beg=${beg}&end=${end}`;

    const res = await fetch(url, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`东方财富 API 返回 ${res.status}`);
    }

    const data = await res.json();
    const klines: string[] = data?.data?.klines;

    if (!klines || klines.length === 0) {
      throw new Error('无法获取 SPY 数据');
    }

    // fields2: f51(日期),f52(开盘),f53(收盘),f54(最高),f55(最低),...
    const series: { date: string; close: number }[] = [];
    for (const line of klines) {
      const parts = line.split(',');
      const date = parts[0];
      const close = parseFloat(parts[2]);
      if (date && !isNaN(close) && close > 0) {
        series.push({ date, close });
      }
    }

    if (series.length === 0) {
      throw new Error('SPY 数据为空');
    }

    // 归一化到 1.0
    const baseClose = series[0].close;
    const navSeries = series.map((s) => ({
      date: s.date,
      nav: s.close / baseClose,
    }));

    return NextResponse.json({
      series: navSeries,
      lastClose: series[series.length - 1].close,
    });
  } catch (err) {
    console.error('SPY fetch error:', err);
    return NextResponse.json(
      { error: '基准数据暂时无法获取，请稍后重试' },
      { status: 502 }
    );
  }
}
