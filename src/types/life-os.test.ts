import { describe, expect, it } from 'vitest';
import {
  birthdayCalendars,
  goalTypes,
  interactionTypes,
  investmentDecisionStatuses,
  investmentDecisionTypes,
  investmentTaskStatuses,
  investmentTaskTypes,
  industryCompanyRoles,
  industryCompanyStages,
  externalVariableOwnerTypes,
  relationshipTypes,
  sourceTypes,
  type Contact,
  type ContactInteraction,
  type Goal,
  type InvestmentTask,
  type IndustryProfile,
  type ResearchProfileInput,
} from './life-os';

describe('Life OS domain values', () => {
  it('keeps shared record provenance values', () => {
    expect(sourceTypes).toEqual(['manual', 'codex', 'automation', 'system']);
  });

  it('separates honest goal progress types', () => {
    expect(goalTypes).toEqual(['result', 'project', 'habit', 'direction']);

    const goal: Goal = {
      id: 'g1', user_id: 'u1', title: '建立两段持续关系', year: 2026,
      description: '', goal_type: 'result', completion_criteria: '完成两次深入交流',
      current_state: '', current_milestone: '', next_action: '联系第一位律师',
      next_action_due_at: null,
      target_value: 2, current_value: 0, value_unit: '人', habit_target_count: null,
      habit_completed_count: null, habit_period: null, last_progress_at: null,
      status: 'active', source_type: 'manual', source_ref: null,
      review_status: 'approved', created_at: '2026-09-28T00:00:00Z',
      updated_at: '2026-09-28T00:00:00Z',
    };

    expect(goal.goal_type).toBe('result');
  });

  it('defines private relationship records and interaction history', () => {
    expect(relationshipTypes).toEqual(['family', 'friend', 'classmate', 'work', 'professional', 'other']);
    expect(birthdayCalendars).toEqual(['solar', 'lunar']);
    expect(interactionTypes).toContain('gift_given');
    expect(interactionTypes).toContain('advice_received');

    const contact: Contact = {
      id: 'c1', user_id: 'u1', name: '王律师', relationship_type: 'professional',
      role: '律师', met_context: '朋友介绍', family_context: '', work_context: '',
      important_notes: '', last_contact_at: null, next_contact_at: '2026-10-10',
      next_action: '约一次深入交流', notes: '', source_type: 'manual', source_ref: null,
      birthday_calendar: null, birthday_year: null, birthday_month: null,
      birthday_day: null, birthday_is_leap_month: false, birthday_reminder_enabled: true,
      holiday_contact_reminder_enabled: false,
      review_status: 'approved', created_at: '2026-09-28T00:00:00Z',
      updated_at: '2026-09-28T00:00:00Z',
    };
    const interaction: ContactInteraction = {
      id: 'i1', user_id: 'u1', contact_id: contact.id, occurred_at: '2026-10-01',
      interaction_type: 'advice_received', summary: '讨论企业合同风险', next_action: '发送资料', next_contact_at: '2026-10-10',
      source_type: 'manual', source_ref: null, review_status: 'approved',
      created_at: '2026-10-01T00:00:00Z',
    };

    expect(interaction.contact_id).toBe(contact.id);
  });

  it('defines standalone investment tasks', () => {
    expect(investmentTaskTypes).toEqual(['price', 'research', 'validation', 'financial_report', 'other']);
    expect(investmentTaskStatuses).toEqual(['pending', 'waiting', 'completed', 'cancelled']);
    const task: InvestmentTask = {
      id: 'it1', user_id: 'u1', asset_name: '腾讯', task_type: 'price', title: '320元附近重新评估',
      condition_note: '检查估值和广告业务', reminder_date: '2026-10-10', status: 'pending', notes: '',
      completed_at: null, source_type: 'manual', source_ref: null, review_status: 'approved',
      created_at: '2026-09-29T00:00:00Z', updated_at: '2026-09-29T00:00:00Z',
    };
    expect(task.asset_name).toBe('腾讯');
  });

  it('defines structured research and investment decision contracts', () => {
    expect(investmentDecisionStatuses).toEqual(['draft', 'finalized']);
    expect(investmentDecisionTypes).toEqual(['buy', 'add', 'hold', 'reduce', 'sell', 'watch', 'skip']);
    const profile: ResearchProfileInput = {
      asset_name: '腾讯',
      business_model: '社交与内容生态变现',
      customer_value: '用户关系链与商家触达',
      competitive_advantage: '关系链与规模',
      long_term_assumptions: '用户与商业化保持平衡',
      invalidation_conditions: '关系链显著迁移',
      earnings_quality: '经营现金流长期覆盖利润',
    };
    expect(profile.asset_name).toBe('腾讯');
  });

  it('defines lightweight industry research contracts', () => {
    expect(industryCompanyStages).toEqual(['upstream', 'industry', 'downstream']);
    expect(industryCompanyRoles).toEqual(['leader', 'challenger', 'supplier', 'customer', 'substitute', 'other']);
    expect(externalVariableOwnerTypes).toEqual(['industry', 'company']);
    const industry: IndustryProfile = {
      id: 'industry-1', user_id: 'u1', name: '云计算', summary_judgment: '需求仍增长但竞争加剧',
      upstream_overview: '芯片与服务器', industry_overview: '云服务商', downstream_overview: '企业客户',
      key_drivers: '企业数字化', risks_and_reversal_signals: '资本开支持续下降', notes: '',
      source_type: 'manual', source_ref: null, review_status: 'approved',
      created_at: '2026-10-08T00:00:00Z', updated_at: '2026-10-08T00:00:00Z',
    };
    expect(industry.name).toBe('云计算');
  });
});
