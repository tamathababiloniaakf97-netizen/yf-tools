import { researchMaterialTypes } from '@/types/life-os';
import type { ResearchMaterialInput, ResearchMaterialType } from '@/types/life-os';

const materialTypeSet = new Set<string>(researchMaterialTypes);

function optionalText(value: string | null | undefined) {
  return value?.trim() || null;
}

export function normalizeResearchMaterialInput(input: ResearchMaterialInput) {
  const errors: string[] = [];
  if (!materialTypeSet.has(input.material_type)) errors.push('请选择有效的资料类型');
  if (!input.title?.trim()) errors.push('请填写标题');
  if (!input.content?.trim()) errors.push('请填写内容或关键摘录');
  if ((input.image_paths?.length ?? 0) > 3) errors.push('每条资料最多保存三张图片');
  if (errors.length) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      material_type: input.material_type,
      title: input.title.trim(),
      content: input.content.trim(),
      asset_name: optionalText(input.asset_name),
      source_name: optionalText(input.source_name),
      source_url: optionalText(input.source_url),
      source_date: optionalText(input.source_date),
      personal_note: optionalText(input.personal_note),
      image_paths: input.image_paths ?? [],
    },
  };
}

export function normalizeMaterialFilters(params: URLSearchParams) {
  const requestedType = params.get('type')?.trim() ?? '';
  return {
    query: params.get('q')?.trim() ?? '',
    materialType: (materialTypeSet.has(requestedType) ? requestedType : '') as ResearchMaterialType | '',
    assetName: params.get('asset_name')?.trim() ?? '',
  };
}

export function buildMaterialSearchTerm(value: string) {
  return value.replace(/[\\%_,]/g, (character) => `\\${character}`);
}
