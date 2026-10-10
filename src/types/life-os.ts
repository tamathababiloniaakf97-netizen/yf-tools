export const sourceTypes = ['manual', 'codex', 'automation', 'system'] as const;
export const reviewStatuses = ['pending', 'approved', 'rejected'] as const;
export const goalTypes = ['result', 'project', 'habit', 'direction'] as const;
export const goalCategories = ['health_energy', 'family_parenting', 'career_creation', 'finance_investment', 'learning_reading', 'interests_experiences', 'relationships_social'] as const;
export const relationshipTypes = ['family', 'friend', 'classmate', 'work', 'professional', 'other'] as const;
export const birthdayCalendars = ['solar', 'lunar'] as const;
export const interactionTypes = ['contact', 'gift_given', 'gift_received', 'advice_received', 'advice_given', 'help_received', 'help_given', 'other'] as const;
export const investmentTaskTypes = ['price', 'research', 'validation', 'financial_report', 'other'] as const;
export const investmentTaskStatuses = ['pending', 'waiting', 'completed', 'cancelled'] as const;
export const investmentDecisionStatuses = ['draft', 'finalized'] as const;
export const investmentDecisionTypes = ['buy', 'add', 'hold', 'reduce', 'sell', 'watch', 'skip'] as const;
export const researchHypothesisStatuses = ['unverified', 'supported', 'challenged', 'inconclusive'] as const;
export const researchChecklistStatuses = ['considered', 'not_applicable', 'needs_validation'] as const;
export const researchMaterialTypes = ['fact', 'news', 'viewpoint', 'report_excerpt'] as const;
export const researchFields = ['business_model', 'customer_value', 'competitive_advantage', 'long_term_assumptions', 'invalidation_conditions', 'earnings_quality', 'management_culture', 'current_judgment', 'risks', 'unknowns', 'investment_thesis'] as const;
export const industryCompanyStages = ['upstream', 'industry', 'downstream'] as const;
export const industryCompanyRoles = ['leader', 'challenger', 'supplier', 'customer', 'substitute', 'other'] as const;
export const externalVariableOwnerTypes = ['industry', 'company'] as const;

export type SourceType = typeof sourceTypes[number];
export type ReviewStatus = typeof reviewStatuses[number];
export type GoalType = typeof goalTypes[number];
export type GoalCategory = typeof goalCategories[number];
export type RelationshipType = typeof relationshipTypes[number];
export type BirthdayCalendar = typeof birthdayCalendars[number];
export type InteractionType = typeof interactionTypes[number];
export type InvestmentTaskType = typeof investmentTaskTypes[number];
export type InvestmentTaskStatus = typeof investmentTaskStatuses[number];
export type InvestmentDecisionStatus = typeof investmentDecisionStatuses[number];
export type InvestmentDecisionType = typeof investmentDecisionTypes[number];
export type InvestmentReviewDecisionType = 'buy' | 'sell' | 'hold' | 'skip';
export type InvestmentJournalType = 'decision_review' | 'missed_opportunity' | 'investment_note';
export type InvestmentReferenceType = 'decision' | 'research' | 'hypothesis' | 'material' | 'journal';
export type CognitionMethodStatus = 'unverified' | 'verified' | 'retired';

export interface CognitionCategory { id: string; user_id: string; name: string; is_active: boolean; sort_order: number; created_at: string; updated_at: string; }
export interface CognitionJournalInput { title: string; occurred_on: string; category_id: string; content: string; context?: string; tags?: string[]; error_tags?: string[]; facts?: string; initial_judgment?: string; judgment_basis?: string; discovered_error?: string; counterevidence?: string; next_action?: string; method_id?: string | null; }
export interface CognitionJournal extends CognitionJournalInput { id: string; user_id: string; context: string; tags: string[]; error_tags: string[]; facts: string; initial_judgment: string; judgment_basis: string; discovered_error: string; counterevidence: string; next_action: string; method_id: string | null; created_at: string; updated_at: string; }
export interface CognitionMethodInput { title: string; category_id: string; content: string; applicable_context?: string; evidence_basis?: string; action_rule?: string; exceptions?: string; status?: CognitionMethodStatus; source_journal_id?: string | null; }
export interface CognitionMethod extends CognitionMethodInput { id: string; user_id: string; applicable_context: string; evidence_basis: string; action_rule: string; exceptions: string; status: CognitionMethodStatus; source_journal_id: string | null; created_at: string; updated_at: string; }

export interface InvestmentJournalReference {
  type: InvestmentReferenceType;
  id: string;
  title: string;
  href: string;
}

export interface InvestmentJournalInput {
  title: string;
  journal_type: InvestmentJournalType;
  review_date: string;
  content: string;
  asset_name?: string;
  tags?: string[];
  references?: InvestmentJournalReference[];
  decision_id?: string | null;
  source_type?: SourceType;
  source_ref?: string | null;
  review_status?: ReviewStatus;
}
export type ResearchHypothesisStatus = typeof researchHypothesisStatuses[number];
export type ResearchChecklistStatus = typeof researchChecklistStatuses[number];
export type ResearchMaterialType = typeof researchMaterialTypes[number];
export type ResearchField = typeof researchFields[number];
export type IndustryCompanyStage = typeof industryCompanyStages[number];
export type IndustryCompanyRole = typeof industryCompanyRoles[number];
export type ExternalVariableOwnerType = typeof externalVariableOwnerTypes[number];

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  year: number;
  description: string;
  goal_type: GoalType;
  category?: GoalCategory | null;
  completion_criteria: string;
  current_state: string;
  current_milestone: string;
  next_action: string;
  next_action_due_at: string | null;
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
  'description' | 'goal_type' | 'category' | 'completion_criteria' | 'current_state' | 'current_milestone' | 'next_action' | 'next_action_due_at' | 'target_value' | 'current_value' |
  'value_unit' | 'habit_target_count' | 'habit_completed_count' | 'habit_period' |
  'last_progress_at' | 'status' | 'source_type' | 'source_ref' | 'review_status'
>>;

export interface GoalProgressUpdate {
  id: string;
  user_id: string;
  goal_id: string;
  occurred_at: string;
  progress_note: string;
  current_state: string;
  current_milestone: string;
  next_action: string;
  next_action_due_at: string | null;
  current_value: number | null;
  habit_completed_count: number | null;
  created_at: string;
}

export type GoalProgressInput = Pick<GoalProgressUpdate, 'occurred_at' | 'progress_note' | 'next_action'> & Partial<Pick<GoalProgressUpdate,
  'current_state' | 'current_milestone' | 'next_action_due_at' | 'current_value' | 'habit_completed_count'
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
  birthday_calendar: BirthdayCalendar | null;
  birthday_year: number | null;
  birthday_month: number | null;
  birthday_day: number | null;
  birthday_is_leap_month: boolean;
  birthday_reminder_enabled: boolean;
  holiday_contact_reminder_enabled: boolean;
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
  'birthday_calendar' | 'birthday_year' | 'birthday_month' | 'birthday_day' |
  'birthday_is_leap_month' | 'birthday_reminder_enabled' |
  'holiday_contact_reminder_enabled' |
  'last_contact_at' | 'next_contact_at' | 'next_action' | 'notes' | 'source_type' |
  'source_ref' | 'review_status'
>>;

export interface ContactInteraction {
  id: string;
  user_id: string;
  contact_id: string;
  occurred_at: string;
  interaction_type: InteractionType;
  summary: string;
  next_action: string;
  next_contact_at: string | null;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
}

export type ContactInteractionInput = Pick<ContactInteraction, 'occurred_at' | 'summary'> & Partial<Pick<ContactInteraction,
  'interaction_type' |
  'next_action' | 'next_contact_at' | 'source_type' | 'source_ref' | 'review_status'
>>;

export interface InvestmentTask {
  id: string;
  user_id: string;
  asset_name: string;
  task_type: InvestmentTaskType;
  title: string;
  condition_note: string;
  ticker_id?: string | null;
  price?: number | null;
  reminder_date: string | null;
  status: InvestmentTaskStatus;
  notes: string;
  completed_at: string | null;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export type InvestmentTaskInput = Pick<InvestmentTask, 'task_type' | 'title'> & Partial<Pick<InvestmentTask,
  'asset_name' | 'condition_note' | 'ticker_id' | 'price' | 'reminder_date' | 'status' | 'notes' | 'completed_at' |
  'source_type' | 'source_ref' | 'review_status'
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
  material_id?: string | null;
  research_field?: ResearchField | null;
}

export interface ResearchMaterialInput {
  material_type: ResearchMaterialType;
  title: string;
  content: string;
  asset_name?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  source_date?: string | null;
  personal_note?: string | null;
  image_paths?: string[];
}

export interface ResearchMaterial extends ResearchMaterialInput {
  id: string;
  user_id: string;
  asset_name: string | null;
  source_name: string | null;
  source_url: string | null;
  source_date: string | null;
  personal_note: string | null;
  image_paths: string[];
  image_urls?: string[];
  created_at: string;
  updated_at: string;
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
  business_model: string;
  customer_value: string;
  competitive_advantage: string;
  long_term_assumptions: string;
  earnings_quality: string;
  management_culture: string;
  unknowns: string;
  industry_profile_id?: string | null;
  industry_impact?: string;
  checklist_state: ResearchChecklistState;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface ResearchChecklistItemState {
  status: ResearchChecklistStatus;
  note: string;
}

export type ResearchChecklistState = Record<string, ResearchChecklistItemState>;

export type ResearchProfileInput = Pick<ResearchProfile, 'asset_name'> & Partial<Pick<ResearchProfile,
  'ticker_id' | 'investment_thesis' | 'current_judgment' | 'risks' |
  'invalidation_conditions' | 'business_model' | 'customer_value' |
  'competitive_advantage' | 'long_term_assumptions' | 'earnings_quality' |
  'management_culture' | 'unknowns' | 'checklist_state' | 'source_type' |
  'source_ref' | 'review_status' | 'industry_profile_id' | 'industry_impact'
>>;

export interface IndustryProfile {
  id: string;
  user_id: string;
  name: string;
  summary_judgment: string;
  upstream_overview: string;
  industry_overview: string;
  downstream_overview: string;
  key_drivers: string;
  risks_and_reversal_signals: string;
  notes: string;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export type IndustryProfileInput = Pick<IndustryProfile, 'name'> & Partial<Pick<IndustryProfile,
  'summary_judgment' | 'upstream_overview' | 'industry_overview' | 'downstream_overview' |
  'key_drivers' | 'risks_and_reversal_signals' | 'notes' | 'source_type' | 'source_ref' | 'review_status'
>>;

export interface IndustryCompany {
  id: string; user_id: string; industry_profile_id: string; name: string;
  stage: IndustryCompanyStage; role: IndustryCompanyRole; importance: string;
  research_profile_id: string | null; created_at: string; updated_at: string;
}
export type IndustryCompanyInput = Pick<IndustryCompany, 'name'> & Partial<Pick<IndustryCompany, 'stage' | 'role' | 'importance' | 'research_profile_id'>>;

export interface IndustryIndicator {
  id: string; user_id: string; industry_profile_id: string; name: string;
  current_observation: string; watch_for: string; created_at: string; updated_at: string;
}
export type IndustryIndicatorInput = Pick<IndustryIndicator, 'name'> & Partial<Pick<IndustryIndicator, 'current_observation' | 'watch_for'>>;

export interface ExternalVariable {
  id: string; user_id: string; owner_type: ExternalVariableOwnerType;
  industry_profile_id: string | null; research_profile_id: string | null;
  name: string; current_state: string; impact: string; watch_for: string;
  reversal_signal: string; created_at: string; updated_at: string;
}
export type ExternalVariableInput = Pick<ExternalVariable, 'owner_type' | 'name'> & Partial<Pick<ExternalVariable,
  'industry_profile_id' | 'research_profile_id' | 'current_state' | 'impact' | 'watch_for' | 'reversal_signal'
>>;

export interface ResearchHypothesis {
  id: string;
  user_id: string;
  research_profile_id: string;
  statement: string;
  key_variables: string;
  status: ResearchHypothesisStatus;
  next_check_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ResearchHypothesisInput = Pick<ResearchHypothesis, 'statement'> & Partial<Pick<ResearchHypothesis,
  'key_variables' | 'status' | 'next_check_at'
>>;

export interface ResearchSnapshotData {
  profile: ResearchProfile;
  hypotheses: ResearchHypothesis[];
}

export interface ResearchSnapshot {
  id: string;
  user_id: string;
  research_profile_id: string;
  snapshot_version: number;
  snapshot_data: ResearchSnapshotData;
  evidence_snapshot: Array<Pick<EvidenceRecord, 'id' | 'content' | 'impact' | 'source_name' | 'source_url' | 'occurred_at' | 'hypothesis_id'>>;
  created_at: string;
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

export interface InvestmentReviewInput {
  ticker_id?: string | null;
  decision_id?: string | null;
  asset_name: string;
  review_date: string;
  decision_type: InvestmentReviewDecisionType;
  original_reason: string;
  actual_result: string;
  correct_points?: string;
  mistake_points?: string;
  lesson: string;
  source_type?: SourceType;
  source_ref?: string | null;
  review_status?: ReviewStatus;
}

export interface InvestmentDecision {
  id: string;
  user_id: string;
  research_profile_id: string;
  research_snapshot_id: string | null;
  asset_name: string;
  status: InvestmentDecisionStatus;
  market_expectation: string;
  personal_divergence: string;
  valuation_conclusion: string;
  valuation_assumptions: string;
  safety_margin: string;
  investment_plan: string;
  error_signals: string;
  error_response: string;
  do_not_list: string[];
  decision_type: InvestmentDecisionType | null;
  final_reason: string;
  decision_date: string | null;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export type InvestmentDecisionInput = Pick<InvestmentDecision, 'research_profile_id' | 'asset_name'> & Partial<Pick<InvestmentDecision,
  'research_snapshot_id' | 'status' | 'market_expectation' | 'personal_divergence' |
  'valuation_conclusion' | 'valuation_assumptions' | 'safety_margin' |
  'investment_plan' | 'error_signals' | 'error_response' | 'do_not_list' |
  'decision_type' | 'final_reason' | 'decision_date' | 'source_type' |
  'source_ref' | 'review_status'
>>;

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

export interface InvestmentJournal extends InvestmentJournalInput {
  id: string;
  user_id: string;
  asset_name: string;
  tags: string[];
  references: InvestmentJournalReference[];
  decision_type?: InvestmentReviewDecisionType;
  original_reason?: string;
  actual_result?: string;
  correct_points?: string;
  mistake_points?: string;
  lesson?: string;
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

export type MarketCycleKey = string;
export type CycleConfidence = 'low' | 'medium' | 'high';
export type CycleIndicatorValueType = 'number' | 'status' | 'text';
export type CycleIndicatorDirection = 'up' | 'flat' | 'down' | 'unknown';
export type CycleIndicatorZone = 'normal' | 'watch' | 'extreme' | 'unknown';

export interface CycleIndicator {
  id: string;
  name: string;
  value_type: CycleIndicatorValueType;
  value: string | number | null;
  direction: CycleIndicatorDirection;
  previous_direction?: CycleIndicatorDirection;
  zone: CycleIndicatorZone;
  source: string;
  observed_on: string | null;
  update_frequency_days: number;
  threshold_note: string;
  note: string;
  watch_direction_change: boolean;
  active: boolean;
}

export interface MarketCycleReviewInput {
  phase: string;
  confidence: CycleConfidence | null;
  summary: string;
  support_evidence: string;
  counter_evidence: string;
  uncertainties: string;
  next_review_at: string;
  indicators: CycleIndicator[];
  cycle_started_on?: string | null;
  cycle_start_price?: number | null;
  latest_price?: number | null;
  latest_price_on?: string | null;
  return_percent?: number | null;
  running_days?: number | null;
}

export interface MarketCycleProfile {
  id: string;
  user_id: string;
  cycle_key: MarketCycleKey;
  name: string;
  is_active?: boolean;
  current_phase: string;
  confidence: CycleConfidence | null;
  summary: string;
  support_evidence?: string;
  counter_evidence?: string;
  uncertainties?: string;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  review_frequency_days: number;
  indicators: CycleIndicator[];
  cycle_started_on?: string | null;
  cycle_start_price?: number | null;
  latest_price?: number | null;
  latest_price_on?: string | null;
  return_percent?: number | null;
  running_days?: number | null;
  ticker_id?: string | null;
  ticker?: { id: string; name: string; code: string; currency: string } | null;
  created_at: string;
  updated_at: string;
}

export interface MarketCycleReview extends MarketCycleReviewInput {
  id: string;
  user_id: string;
  profile_id: string;
  reviewed_on: string;
  created_at: string;
}

export interface LifeReinforcementProject {
  id: string;
  user_id: string;
  name: string;
  long_term_goal: string;
  practical_method: string;
  stages: string[];
  default_key: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type LifeReinforcementProjectInput = Pick<LifeReinforcementProject, 'name'> & Partial<Pick<LifeReinforcementProject,
  'long_term_goal' | 'practical_method' | 'stages' | 'is_active'
>>;

export interface LifeTrainingRecord {
  id: string;
  user_id: string;
  project_id: string;
  trained_on: string;
  stage_name: string;
  session_goal: string;
  activity: string;
  result_notes: string;
  created_at: string;
  updated_at: string;
}

export type LifeTrainingRecordInput = Pick<LifeTrainingRecord, 'trained_on' | 'activity'> & Partial<Pick<LifeTrainingRecord,
  'stage_name' | 'session_goal' | 'result_notes'
>>;
