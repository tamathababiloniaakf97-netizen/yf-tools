import { describe, expect, it } from 'vitest';
import {
  normalizeEvidenceInput,
  validateInvestmentReviewInput,
  validateMethodologyInput,
  validateWatchlistInput,
} from './records';

describe('investment records', () => {
  it('requires only a watch title and allows details to be added later', () => {
    const result = validateWatchlistInput({ ticker_id: null, asset_name: ' 腾讯游戏收入增速 ', reason: '', entry_condition: '' });
    expect(result.ok && result.value).toMatchObject({
      asset_name: '腾讯游戏收入增速', reason: '', entry_condition: '', status: 'watching',
    });
    expect(validateWatchlistInput({ ticker_id: null, asset_name: ' ', reason: '', entry_condition: '' }))
      .toEqual({ ok: false, errors: ['请填写关注事项'] });
  });

  it('keeps automation evidence pending until the user reviews it', () => {
    const result = normalizeEvidenceInput({
      asset_name: '泡泡玛特', content: '海外收入增长', impact: 'support',
      source_type: 'automation', source_ref: 'collector:123',
    });
    expect(result.ok && result.value.review_status).toBe('pending');
  });

  it('keeps a research material link when citing it as evidence', () => {
    const result = normalizeEvidenceInput({
      asset_name: '腾讯控股', content: '续约率保持稳定', impact: 'neutral', material_id: ' material-1 ',
    });
    expect(result.ok && result.value.material_id).toBe('material-1');
  });

  it('keeps a valid current-research field and rejects unknown fields', () => {
    const valid = normalizeEvidenceInput({
      asset_name: '腾讯控股', content: '续约率保持稳定', impact: 'support', research_field: 'customer_value',
    });
    const invalid = normalizeEvidenceInput({
      asset_name: '腾讯控股', content: '续约率保持稳定', impact: 'support', research_field: 'unknown' as never,
    });
    expect(valid.ok && valid.value.research_field).toBe('customer_value');
    expect(invalid).toEqual({ ok: false, errors: ['请选择有效的当前研究栏目'] });
  });

  it('requires an investment review to record the original reason and lesson', () => {
    expect(validateInvestmentReviewInput({
      asset_name: '腾讯', review_date: '2026-09-28', decision_type: 'hold',
      original_reason: '', actual_result: '广告恢复增长', lesson: '',
    })).toEqual({ ok: false, errors: ['请填写当初的判断依据', '请填写本次复盘结论'] });
  });

  it('keeps an optional original decision link without requiring old reviews to add one', () => {
    const linked = validateInvestmentReviewInput({
      asset_name: '腾讯', review_date: '2026-09-28', decision_type: 'hold',
      original_reason: '长期逻辑仍成立', actual_result: '', lesson: '继续验证', decision_id: ' decision-1 ',
    } as Parameters<typeof validateInvestmentReviewInput>[0] & { decision_id: string });
    const legacy = validateInvestmentReviewInput({
      asset_name: '腾讯', review_date: '2026-09-28', decision_type: 'hold',
      original_reason: '长期逻辑仍成立', actual_result: '', lesson: '继续验证',
    });
    expect(linked.ok && linked.value.decision_id).toBe('decision-1');
    expect(legacy.ok && legacy.value.decision_id).toBeNull();
  });

  it('keeps automated methodology pending and traceable', () => {
    const result = validateMethodologyInput({
      title: '不追高', content: '估值超过预设区间时不新增仓位', category: 'discipline',
      source_type: 'automation', source_ref: 'review:123',
    });
    expect(result.ok && result.value.review_status).toBe('pending');
    expect(result.ok && result.value.source_ref).toBe('review:123');
  });
});
