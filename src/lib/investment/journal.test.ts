import { describe, expect, it } from 'vitest';
import { filterInvestmentJournals, journalContent, normalizeInvestmentJournalInput } from './journal';

describe('normalizeInvestmentJournalInput', () => {
  it('keeps a journal lightweight and cleans tags and references', () => {
    const result = normalizeInvestmentJournalInput({
      title: '  没有写清买入条件  ', journal_type: 'missed_opportunity', review_date: '2026-09-28',
      content: '  等待变成了没有期限的拖延。  ', asset_name: ' 泡泡玛特 ', tags: [' 估值 ', '', '执行'],
      references: [{ type: 'decision', id: 'd1', title: ' 买入决策 ', href: '/investment/decisions/d1' }],
    });

    expect(result).toEqual({ ok: true, value: expect.objectContaining({
      title: '没有写清买入条件', journal_type: 'missed_opportunity', content: '等待变成了没有期限的拖延。',
      asset_name: '泡泡玛特', tags: ['估值', '执行'],
      references: [{ type: 'decision', id: 'd1', title: '买入决策', href: '/investment/decisions/d1' }],
    }) });
  });

  it('rejects missing required journal fields', () => {
    const result = normalizeInvestmentJournalInput({ title: '', journal_type: 'investment_note', review_date: '', content: '' });
    expect(result).toEqual({ ok: false, errors: ['请填写标题', '请选择日期', '请填写正文'] });
  });
});

describe('legacy review compatibility', () => {
  it('combines the useful structured fields when an old review has no journal body', () => {
    expect(journalContent({ content: '', original_reason: '看好现金流', actual_result: '利润增长', correct_points: '', mistake_points: '仓位过重', lesson: '分批买入' })).toContain('【当初依据】\n看好现金流');
    expect(journalContent({ content: '', original_reason: '看好现金流', actual_result: '利润增长', correct_points: '', mistake_points: '仓位过重', lesson: '分批买入' })).toContain('【复盘结论】\n分批买入');
  });
});

describe('filterInvestmentJournals', () => {
  const items = [
    { id:'1', title:'腾讯加仓复盘', content:'广告恢复', asset_name:'腾讯', tags:['仓位'], journal_type:'decision_review' },
    { id:'2', title:'错过泡泡玛特', content:'没有行动条件', asset_name:'泡泡玛特', tags:['估值'], journal_type:'missed_opportunity' },
  ];

  it('searches title, body, asset and tags and can limit the journal type', () => {
    expect(filterInvestmentJournals(items, '估值', 'all').map(item => item.id)).toEqual(['2']);
    expect(filterInvestmentJournals(items, '', 'decision_review').map(item => item.id)).toEqual(['1']);
  });
});
