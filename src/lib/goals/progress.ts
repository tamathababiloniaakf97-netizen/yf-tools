import type { Goal } from '@/types/life-os';

export type GoalProgress =
  | { kind: 'value'; current: number | null; target: number | null; unit: string; percent: number | null }
  | { kind: 'milestone'; milestone: string; percent: null }
  | { kind: 'habit'; completed: number | null; target: number | null; period: Goal['habit_period']; percent: null }
  | { kind: 'direction'; currentState: string; percent: null };

export type GoalStagnation = 'check' | 'stalled' | null;

export function buildGoalProgress(goal: Goal): GoalProgress {
  if (goal.goal_type === 'result') {
    const measurable = goal.target_value !== null && goal.target_value > 0 && goal.current_value !== null;
    const percent = measurable
      ? Math.min(100, Math.max(0, Math.round((goal.current_value! / goal.target_value!) * 100)))
      : null;
    return { kind: 'value', current: goal.current_value, target: goal.target_value, unit: goal.value_unit, percent };
  }
  if (goal.goal_type === 'project') {
    return { kind: 'milestone', milestone: goal.current_milestone, percent: null };
  }
  if (goal.goal_type === 'habit') {
    return {
      kind: 'habit', completed: goal.habit_completed_count,
      target: goal.habit_target_count, period: goal.habit_period, percent: null,
    };
  }
  return { kind: 'direction', currentState: goal.current_state, percent: null };
}

export function getStagnation(goal: Goal, now = new Date()): GoalStagnation {
  if (goal.status !== 'active') return null;
  const reference = goal.last_progress_at ?? goal.created_at;
  const elapsedDays = (now.getTime() - new Date(reference).getTime()) / 86_400_000;
  if (elapsedDays >= 30) return 'stalled';
  if (elapsedDays >= 14) return 'check';
  return null;
}
