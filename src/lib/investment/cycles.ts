import type { CycleIndicator, MarketCycleKey, MarketCycleProfile, MarketCycleReviewInput } from '@/types/life-os';

export interface CycleTemplate {
  key: MarketCycleKey;
  name: string;
  description: string;
  reviewFrequencyDays: number;
  review_frequency_days: number;
  indicators: CycleIndicator[];
}

export const cyclePhaseOptions = [
  { value: '启动', prompt: '是否出现低位企稳、基本面改善或新的驱动力？' },
  { value: '扩张', prompt: '上涨是否由基本面、资金和参与者共同推动？' },
  { value: '亢奋', prompt: '市场是否开始忽略风险、估值和反面证据？' },
  { value: '转弱', prompt: '价格仍高，但趋势、基本面或情绪是否开始减弱？' },
  { value: '下跌', prompt: '负反馈是否形成，悲观是否仍在扩散？' },
  { value: '修复', prompt: '极端悲观是否缓解，价格和基本面是否开始企稳？' },
] as const;

export function getCyclePhasePrompt(phase: string) {
  return cyclePhaseOptions.find((item) => item.value === phase)?.prompt ?? '';
}

type CycleProgressInput = Pick<MarketCycleReviewInput, 'cycle_started_on' | 'cycle_start_price' | 'latest_price' | 'latest_price_on'>;

const cleanText = (value: unknown) => String(value ?? '').trim();
const normalizeIndicators = (input: unknown) => (Array.isArray(input) ? input : []).map((item, index) => ({
  ...item, id: cleanText(item.id) || `indicator-${index + 1}`, name: cleanText(item.name), source: cleanText(item.source),
  threshold_note: cleanText(item.threshold_note), note: cleanText(item.note), value: typeof item.value === 'number' ? item.value : cleanText(item.value) || null,
  observed_on: cleanText(item.observed_on) || null, update_frequency_days: Math.max(1, Number(item.update_frequency_days) || 30),
  active: item.active !== false, watch_direction_change: item.watch_direction_change === true,
})).filter((item) => item.name);

export function calculateCycleProgress(input: CycleProgressInput) {
  const validDate = (value?: string | null) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!validDate(input.cycle_started_on) || !validDate(input.latest_price_on)) return { ok:false as const, errors:['周期日期格式无效'] };
  let runningDays: number | null = null;
  if (input.cycle_started_on && input.latest_price_on) {
    const start = Date.parse(`${input.cycle_started_on}T00:00:00Z`); const end = Date.parse(`${input.latest_price_on}T00:00:00Z`);
    if (end < start) return { ok:false as const, errors:['最新价格日期不能早于周期启动日期'] };
    runningDays = Math.round((end - start) / 86400000);
  }
  const returnPercent = input.cycle_start_price != null && input.latest_price != null
    ? Math.round(((input.latest_price - input.cycle_start_price) / input.cycle_start_price) * 10000) / 100
    : null;
  return { ok:true as const, return_percent:returnPercent, running_days:runningDays };
}

const indicator = (id: string, name: string, valueType: CycleIndicator['value_type'] = 'status', frequency = 30): CycleIndicator => ({
  id, name, value_type: valueType, value: null, direction: 'unknown', zone: 'unknown', source: '', observed_on: null,
  update_frequency_days: frequency, threshold_note: '', note: '', watch_direction_change: false, active: true,
});

export const cycleTemplates: CycleTemplate[] = [
  { key: 'ai_global', name: '全球 AI 产业周期', description: '以美国科技公司、算力资本开支和商业化进展为主，按季度复核。', reviewFrequencyDays: 90, review_frequency_days: 90, indicators: [
    indicator('cloud_capex', '云厂商 AI 资本开支', 'status', 90), indicator('accelerator_growth', 'AI 加速器收入增速', 'number', 90),
    indicator('compute_supply', '算力供需与交付周期', 'status', 60), indicator('power_constraint', '数据中心建设与电力约束', 'status', 90),
    indicator('ai_monetization', 'AI 商业化收入与付费采用', 'status', 90), indicator('semiconductor_inventory', '半导体库存与订单变化', 'status', 60),
  ] },
  { key: 'sp500_valuation', name: '标普 500 估值周期', description: '观察估值、盈利预期和利率环境的组合，不把单一倍数当作择时结论。', reviewFrequencyDays: 30, review_frequency_days: 30, indicators: [
    indicator('forward_pe', '预期市盈率', 'number'), indicator('cape', '周期调整市盈率', 'number'),
    indicator('erp', '股票风险溢价', 'number'), indicator('earnings_revision', '盈利预期修正', 'status'),
    indicator('real_yield', '实际利率', 'number'), indicator('concentration', '指数集中度', 'status'),
  ] },
  { key: 'a_share', name: 'A 股周期', description: '结合信用、盈利、估值、市场广度与政策环境做月度观察。', reviewFrequencyDays: 30, review_frequency_days: 30, indicators: [
    indicator('credit_impulse', '信用扩张与融资需求', 'status'), indicator('earnings_expectation', '企业盈利预期', 'status'),
    indicator('market_breadth', '市场广度', 'status'), indicator('valuation_percentile', '主要指数估值分位', 'number'),
    indicator('risk_appetite', '成交与风险偏好', 'status'), indicator('policy_environment', '政策环境', 'text'),
  ] },
  { key: 'btc', name: 'BTC 周期', description: '结合链上估值、长期持有者行为与全球流动性，避免只看减半叙事。', reviewFrequencyDays: 30, review_frequency_days: 30, indicators: [
    indicator('long_ma_multiple', '长期均线倍数', 'number'), indicator('mvrv', 'MVRV', 'number'),
    indicator('realized_price', '价格与已实现价格关系', 'status'), indicator('long_holder', '长期持有者行为', 'status'),
    indicator('global_liquidity', '全球流动性环境', 'status'), indicator('halving_stage', '减半周期阶段', 'text'),
  ] },
];

export function placeholderProfile(template: CycleTemplate): MarketCycleProfile {
  return { id: '', user_id: '', cycle_key: template.key, name: template.name, is_active: true, current_phase: '', confidence: null, summary: '',
    support_evidence: '', counter_evidence: '', uncertainties: '', last_reviewed_at: null, next_review_at: null,
    review_frequency_days: template.reviewFrequencyDays, indicators: template.indicators, cycle_started_on:null, cycle_start_price:null,
    latest_price:null, latest_price_on:null, return_percent:null, running_days:null, ticker_id:null, ticker:null, created_at: '', updated_at: '' };
}

export function mergeCycleProfiles(profiles: MarketCycleProfile[] = []) {
  if (profiles.some((item) => item.is_active !== undefined)) return profiles.filter((item) => item.is_active !== false);
  const presetKeys = new Set(cycleTemplates.map((item) => item.key));
  return [
    ...cycleTemplates.map((template) => profiles.find((item) => item.cycle_key === template.key) ?? placeholderProfile(template)),
    ...profiles.filter((item) => !presetKeys.has(item.cycle_key)),
  ];
}

export function describeCycleLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '未知错误');
  if (message.includes('market_cycle_profiles') && message.toLowerCase().includes('schema cache')) {
    return '数据库尚未安装周期观察表，请执行迁移 031_market_cycle_observer.sql 后刷新';
  }
  return message;
}

export function normalizeCycleReviewInput(input: Partial<MarketCycleReviewInput>) {
  const clean = cleanText;
  const errors: string[] = [];
  const phase = clean(input.phase);
  const summary = clean(input.summary);
  const nextReview = clean(input.next_review_at);
  if (!phase) errors.push('请选择或填写周期阶段');
  if (!summary) errors.push('请填写当前判断');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nextReview)) errors.push('请选择下次复核日期');
  const optionalDate = (value: unknown) => clean(value) || null;
  const optionalPrice = (value: unknown, label: string) => {
    if (value === null || value === undefined || value === '') return null;
    const price = Number(value); if (!Number.isFinite(price) || price <= 0) { errors.push(`${label}必须大于零`); return null; }
    return price;
  };
  const cycle_started_on=optionalDate(input.cycle_started_on), latest_price_on=optionalDate(input.latest_price_on);
  const cycle_start_price=optionalPrice(input.cycle_start_price,'周期启动价格'), latest_price=optionalPrice(input.latest_price,'最新价格');
  if ((latest_price == null) !== (latest_price_on == null)) errors.push('最新价格和价格日期必须同时填写');
  const progress=calculateCycleProgress({cycle_started_on,cycle_start_price,latest_price,latest_price_on});
  if (!progress.ok) errors.push(...progress.errors);
  const indicators = normalizeIndicators(input.indicators);
  const value: MarketCycleReviewInput = { phase, confidence: input.confidence ?? null, summary,
    support_evidence: clean(input.support_evidence), counter_evidence: clean(input.counter_evidence), uncertainties: clean(input.uncertainties),
    next_review_at: nextReview, indicators, cycle_started_on, cycle_start_price, latest_price, latest_price_on,
    return_percent:progress.ok?progress.return_percent:null, running_days:progress.ok?progress.running_days:null };
  return errors.length ? { ok: false as const, errors } : { ok: true as const, value };
}

export function normalizeCycleProfilePatch(input: Record<string, unknown>) {
  const value: Record<string, unknown> = {}; const errors: string[] = [];
  for (const key of ['name','summary','support_evidence','counter_evidence','uncertainties'] as const) if (key in input) value[key]=cleanText(input[key]);
  if ('current_phase' in input) value.current_phase=cleanText(input.current_phase);
  if ('confidence' in input) value.confidence=input.confidence===null||['low','medium','high'].includes(String(input.confidence))?input.confidence:null;
  if ('next_review_at' in input) { const date=cleanText(input.next_review_at)||null; if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))errors.push('下次复核日期格式无效'); value.next_review_at=date; }
  if ('review_frequency_days' in input) value.review_frequency_days=Math.max(7,Math.min(365,Number(input.review_frequency_days)||30));
  if ('is_active' in input) value.is_active=input.is_active===true;
  if ('ticker_id' in input) value.ticker_id=input.ticker_id===null||input.ticker_id===''?null:cleanText(input.ticker_id);
  if ('indicators' in input) { if(!Array.isArray(input.indicators))errors.push('观察指标格式无效'); else value.indicators=normalizeIndicators(input.indicators); }
  const priceKeys=['cycle_started_on','cycle_start_price','latest_price','latest_price_on'];
  if(priceKeys.some(key=>key in input)){
    if(!priceKeys.every(key=>key in input))errors.push('请完整提交周期价格信息');
    const optionalDate=(raw:unknown)=>cleanText(raw)||null;
    const optionalPrice=(raw:unknown,label:string)=>{if(raw===null||raw===undefined||raw==='')return null;const number=Number(raw);if(!Number.isFinite(number)||number<=0){errors.push(`${label}必须大于零`);return null;}return number;};
    const cycle_started_on=optionalDate(input.cycle_started_on),latest_price_on=optionalDate(input.latest_price_on);
    const cycle_start_price=optionalPrice(input.cycle_start_price,'周期启动价格'),latest_price=optionalPrice(input.latest_price,'最新价格');
    if((latest_price==null)!==(latest_price_on==null))errors.push('最新价格和价格日期必须同时填写');
    const progress=calculateCycleProgress({cycle_started_on,cycle_start_price,latest_price,latest_price_on});if(!progress.ok)errors.push(...progress.errors);
    Object.assign(value,{cycle_started_on,cycle_start_price,latest_price,latest_price_on,return_percent:progress.ok?progress.return_percent:null,running_days:progress.ok?progress.running_days:null});
  }
  return errors.length?{ok:false as const,errors}:{ok:true as const,value};
}

export type CycleAlert = { kind: 'review_due' | 'indicator_zone' | 'data_stale' | 'direction_change'; severity: 'warning' | 'error'; title: string; description: string; indicatorId?: string };

export function buildCycleAlerts(profile: MarketCycleProfile, now = new Date()): CycleAlert[] {
  const alerts: CycleAlert[] = [];
  if (profile.next_review_at && new Date(`${profile.next_review_at}T23:59:59`).getTime() < now.getTime()) alerts.push({ kind: 'review_due', severity: 'warning', title: '到期复核', description: `计划复核日为 ${profile.next_review_at}` });
  for (const item of profile.indicators.filter((entry) => entry.active !== false)) {
    if (item.zone === 'watch' || item.zone === 'extreme') alerts.push({ kind: 'indicator_zone', severity: item.zone === 'extreme' ? 'error' : 'warning', title: `${item.name}进入${item.zone === 'extreme' ? '极端' : '观察'}区`, description: item.note || item.threshold_note || '需要重新检查原判断', indicatorId: item.id });
  }
  for (const item of profile.indicators.filter((entry) => entry.active !== false)) {
    if (!item.observed_on) continue;
    const due = new Date(`${item.observed_on}T00:00:00`); due.setDate(due.getDate() + item.update_frequency_days);
    if (due.getTime() < now.getTime()) alerts.push({ kind: 'data_stale', severity: 'warning', title: `${item.name}数据已过期`, description: `上次观察于 ${item.observed_on}`, indicatorId: item.id });
    if (item.watch_direction_change && item.previous_direction && item.previous_direction !== 'unknown' && item.direction !== 'unknown' && item.previous_direction !== item.direction) alerts.push({ kind: 'direction_change', severity: 'warning', title: `${item.name}方向发生变化`, description: `${item.previous_direction} → ${item.direction}`, indicatorId: item.id });
  }
  return alerts;
}
