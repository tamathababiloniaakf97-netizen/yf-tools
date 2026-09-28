export const planStatuses = [
  'not_started',
  'in_progress',
  'completed',
  'paused',
  'overdue',
  'cancelled',
] as const;

export const planDomains = ['investment', 'annual_goal', 'life'] as const;
export const planTypes = ['validation', 'research', 'trade', 'action', 'decision', 'life'] as const;
export const sourceTypes = ['manual', 'codex', 'automation', 'system'] as const;
export const reviewStatuses = ['pending', 'approved', 'rejected'] as const;
export const goalTypes = ['result', 'project', 'habit', 'direction'] as const;
export const relationshipTypes = ['family', 'friend', 'work', 'professional', 'other'] as const;

export type PlanStatus = typeof planStatuses[number];
export type PlanDomain = typeof planDomains[number];
export type PlanType = typeof planTypes[number];
export type SourceType = typeof sourceTypes[number];
export type ReviewStatus = typeof reviewStatuses[number];
export type GoalType = typeof goalTypes[number];
export type RelationshipType = typeof relationshipTypes[number];

export interface Plan {
  id: string;
  user_id: string;
  title: string;
  description: string;
  plan_type: PlanType;
  domain: PlanDomain;
  project_id: string | null;
  start_date: string | null;
  due_date: string | null;
  reminder_at: string | null;
  recurrence_rule: string | null;
  status: PlanStatus;
  is_weekly_focus: boolean;
  notes: string;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PlanInput = Pick<Plan, 'title' | 'plan_type' | 'domain'> &
  Partial<Pick<Plan,
    'description' | 'project_id' | 'start_date' | 'due_date' | 'reminder_at' |
    'recurrence_rule' | 'status' | 'is_weekly_focus' | 'notes' | 'source_type' |
    'source_ref' | 'review_status'
  >>;

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  year: number;
  description: string;
  goal_type: GoalType;
  completion_criteria: string;
  current_state: string;
  current_milestone: string;
  next_action: string;
  target_value: number | null;
  current_value: number | null;
  value_unit: string;
  habit_target_count: number | null;
  habit_completed_count: number | null;
  habit_period: 'weekly' | 'monthly' | 'quarterly' | null;
  last_progress_at: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export type GoalInput = Pick<Goal, 'title' | 'year'> & Partial<Pick<Goal,
  'description' | 'goal_type' | 'completion_criteria' | 'current_state' | 'current_milestone' | 'next_action' | 'target_value' | 'current_value' |
  'value_unit' | 'habit_target_count' | 'habit_completed_count' | 'habit_period' |
  'last_progress_at' | 'status' | 'source_type' | 'source_ref' | 'review_status'
>>;

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  relationship_type: RelationshipType;
  role: string;
  met_context: string;
  family_context: string;
  work_context: string;
  important_notes: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
  next_action: string;
  notes: string;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export type ContactInput = Pick<Contact, 'name' | 'relationship_type'> & Partial<Pick<Contact,
  'role' | 'met_context' | 'family_context' | 'work_context' | 'important_notes' |
  'last_contact_at' | 'next_contact_at' | 'next_action' | 'notes' | 'source_type' |
  'source_ref' | 'review_status'
>>;

export interface ContactInteraction {
  id: string;
  user_id: string;
  contact_id: string;
  occurred_at: string;
  summary: string;
  next_action: string;
  next_contact_at: string | null;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
}

export type ContactInteractionInput = Pick<ContactInteraction, 'occurred_at' | 'summary'> & Partial<Pick<ContactInteraction,
  'next_action' | 'next_contact_at' | 'source_type' | 'source_ref' | 'review_status'
>>;

export type WatchStatus = 'watching' | 'near_condition' | 'validating' | 'paused';

export interface WatchlistItem {
  id: string;
  user_id: string;
  ticker_id: string | null;
  asset_name: string;
  reason: string;
  entry_condition: string;
  status: WatchStatus;
  next_check_at: string | null;
  notes: string;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export type WatchlistInput = Pick<WatchlistItem, 'ticker_id' | 'asset_name' | 'reason' | 'entry_condition'> &
  Partial<Pick<WatchlistItem, 'status' | 'next_check_at' | 'notes' | 'source_type' | 'source_ref' | 'review_status'>>;

export type EvidenceImpact = 'support' | 'challenge' | 'mixed' | 'neutral';

export interface EvidenceInput {
  ticker_id?: string | null;
  asset_name: string;
  hypothesis_id?: string | null;
  content: string;
  impact: EvidenceImpact;
  source_name?: string;
  source_url?: string | null;
  occurred_at?: string | null;
  source_type?: SourceType;
  source_ref?: string | null;
  review_status?: ReviewStatus;
}

export interface ResearchProfile {
  id: string;
  user_id: string;
  ticker_id: string | null;
  asset_name: string;
  investment_thesis: string;
  current_judgment: string;
  risks: string;
  invalidation_conditions: string;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface EvidenceRecord extends EvidenceInput {
  id: string;
  user_id: string;
  source_name: string;
  source_url: string | null;
  occurred_at: string | null;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
}

export type InvestmentDecisionType = 'buy' | 'sell' | 'hold' | 'skip';

export interface InvestmentReviewInput {
  ticker_id?: string | null;
  asset_name: string;
  review_date: string;
  decision_type: InvestmentDecisionType;
  original_reason: string;
  actual_result: string;
  correct_points?: string;
  mistake_points?: string;
  lesson: string;
  source_type?: SourceType;
  source_ref?: string | null;
  review_status?: ReviewStatus;
}

export interface InvestmentReview extends InvestmentReviewInput {
  id: string;
  user_id: string;
  correct_points: string;
  mistake_points: string;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export type MethodologyCategory = 'selection' | 'valuation' | 'position' | 'discipline' | 'review';

export interface MethodologyInput {
  title: string;
  content: string;
  category: MethodologyCategory;
  status?: 'active' | 'retired';
  source_type?: SourceType;
  source_ref?: string | null;
  review_status?: ReviewStatus;
}

export interface MethodologyItem extends MethodologyInput {
  id: string;
  user_id: string;
  status: 'active' | 'retired';
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}
