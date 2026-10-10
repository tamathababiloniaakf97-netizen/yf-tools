import { describe, expect, it } from 'vitest';
import { buildCycleAlerts, calculateCycleProgress, cyclePhaseOptions, cycleTemplates, describeCycleLoadError, getCyclePhasePrompt, normalizeCycleProfilePatch, normalizeCycleReviewInput, placeholderProfile } from './cycles';

describe('market cycle observer', () => {
  it('provides four practical manual-review templates', () => {
    expect(cycleTemplates.map((item) => [item.key, item.review_frequency_days])).toEqual([
      ['ai_global', 90], ['sp500_valuation', 30], ['a_share', 30], ['btc', 30],
    ]);
    expect(cycleTemplates.every((item) => item.indicators.length >= 4 && item.indicators.length <= 6)).toBe(true);
  });

  it('never assigns a default price benchmark to a cycle template', () => {
    expect(cycleTemplates.map(placeholderProfile).every((profile) => profile.ticker_id === null && profile.ticker === null)).toBe(true);
  });

  it('turns a missing-table database error into an actionable migration message', () => {
    expect(describeCycleLoadError(new Error("Could not find the table 'public.market_cycle_profiles' in the schema cache"))).toBe('数据库尚未安装周期观察表，请执行迁移 031_market_cycle_observer.sql 后刷新');
  });

  it('normalizes a review while preserving conflicting evidence', () => {
    const result = normalizeCycleReviewInput({
      phase: '  扩张 ', confidence: 'medium', summary: ' 需求仍在增长 ', support_evidence: ' 云厂商资本开支上调 ',
      counter_evidence: ' 部分企业商业化收入不足 ', uncertainties: ' 供给增速 ', next_review_at: '2027-01-08',
      indicators: [{ id:'capex', name:'资本开支', value_type:'status', value:' 改善 ', direction:'up', zone:'watch', source:'财报', observed_on:'2026-10-08', update_frequency_days:90, threshold_note:'增速转负时复核', note:'', watch_direction_change:true, active:true }],
    });
    expect(result).toEqual({ ok:true, value:expect.objectContaining({ phase:'扩张', summary:'需求仍在增长', counter_evidence:'部分企业商业化收入不足', indicators:[expect.objectContaining({ value:'改善' })] }) });
  });

  it('reports due, watch-zone and stale-data reasons without trading advice', () => {
    const alerts = buildCycleAlerts({ next_review_at:'2026-10-01', indicators:[
      { id:'pe', name:'远期市盈率', value_type:'number', value:'22', direction:'up', zone:'watch', source:'手工', observed_on:'2026-08-01', update_frequency_days:30, threshold_note:'高于22倍', note:'', watch_direction_change:true, active:true },
    ] }, new Date('2026-10-08T12:00:00+08:00'));
    expect(alerts.map((item) => item.kind)).toEqual(['review_due','indicator_zone','data_stale']);
    expect(alerts.join(' ')).not.toMatch(/买入|卖出|加仓|减仓/);
  });

  it('calculates manual cycle return and calendar-day duration', () => {
    expect(calculateCycleProgress({ cycle_started_on:'2026-01-01', cycle_start_price:100, latest_price:125, latest_price_on:'2026-01-31' }))
      .toEqual({ ok:true, return_percent:25, running_days:30 });
    expect(calculateCycleProgress({ cycle_started_on:'2026-01-01', cycle_start_price:100, latest_price:80, latest_price_on:'2026-01-11' }))
      .toEqual({ ok:true, return_percent:-20, running_days:10 });
    expect(calculateCycleProgress({ cycle_started_on:null, cycle_start_price:null, latest_price:null, latest_price_on:null }))
      .toEqual({ ok:true, return_percent:null, running_days:null });
    expect(calculateCycleProgress({ cycle_started_on:'2026-02-01', cycle_start_price:100, latest_price:110, latest_price_on:'2026-01-31' }).ok).toBe(false);
  });

  it('provides six optional pendulum-stage prompts without inferring a phase', () => {
    expect(cyclePhaseOptions.map((item)=>item.value)).toEqual(['启动','扩张','亢奋','转弱','下跌','修复']);
    expect(getCyclePhasePrompt('亢奋')).toContain('忽略风险');
    expect(getCyclePhasePrompt('自定义阶段')).toBe('');
  });

  it('validates and freezes manual prices in review input', () => {
    const base={phase:'扩张',confidence:null,summary:'继续观察',support_evidence:'',counter_evidence:'',uncertainties:'',next_review_at:'2026-11-01',indicators:[]};
    expect(normalizeCycleReviewInput({...base,cycle_started_on:'2026-01-01',cycle_start_price:100,latest_price:125,latest_price_on:'2026-01-31'}))
      .toMatchObject({ok:true,value:{return_percent:25,running_days:30}});
    expect(normalizeCycleReviewInput({...base,cycle_start_price:0}).ok).toBe(false);
    expect(normalizeCycleReviewInput({...base,latest_price:125,latest_price_on:null}).ok).toBe(false);
    expect(normalizeCycleReviewInput(base)).toMatchObject({ok:true,value:{return_percent:null,running_days:null}});
  });

  it('normalizes only fields supplied by an independent section editor',()=>{
    expect(normalizeCycleProfilePatch({uncertainties:''})).toEqual({ok:true,value:{uncertainties:''}});
    expect(normalizeCycleProfilePatch({cycle_started_on:'2026-01-01',cycle_start_price:100,latest_price:125,latest_price_on:'2026-01-31'}))
      .toEqual({ok:true,value:{cycle_started_on:'2026-01-01',cycle_start_price:100,latest_price:125,latest_price_on:'2026-01-31',return_percent:25,running_days:30}});
    expect(normalizeCycleProfilePatch({latest_price:125}).ok).toBe(false);
  });

  it('cleans a complete indicator replacement without restoring deleted items',()=>{
    const result=normalizeCycleProfilePatch({indicators:[{id:'kept',name:' 保留指标 ',value_type:'text',value:' 改善 ',direction:'up',zone:'normal',source:' 手工 ',observed_on:null,update_frequency_days:30,threshold_note:'',note:'',watch_direction_change:false,active:true}]});
    expect(result).toMatchObject({ok:true,value:{indicators:[{id:'kept',name:'保留指标',value:'改善',source:'手工'}]}});
  });
});
