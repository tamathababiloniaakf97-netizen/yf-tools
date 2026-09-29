import { investmentTaskTypes } from '@/types/life-os';
import type { InvestmentTaskInput, InvestmentTaskType } from '@/types/life-os';

export function taskPrefillFromSearchParams(params: URLSearchParams): InvestmentTaskInput | null {
  if (params.get('new') !== '1') return null;
  const requestedType = params.get('task_type');
  const taskType: InvestmentTaskType = requestedType && investmentTaskTypes.includes(requestedType as InvestmentTaskType) ? requestedType as InvestmentTaskType : 'research';
  return {
    asset_name: params.get('asset_name')?.trim() ?? '',
    task_type: taskType,
    title: params.get('title')?.trim() ?? '',
    condition_note: params.get('condition_note')?.trim() ?? '',
    status: 'pending',
  };
}
