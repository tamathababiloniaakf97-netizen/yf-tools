import { describe, expect, it } from 'vitest';
import {
  buildMaterialSearchTerm,
  normalizeMaterialFilters,
  normalizeResearchMaterialInput,
} from './research-materials';

describe('research materials', () => {
  it('requires only title, content, and material type', () => {
    expect(normalizeResearchMaterialInput({
      material_type: 'fact', title: ' 续费率稳定 ', content: ' 连续三个季度稳定 ',
    })).toMatchObject({
      ok: true,
      value: { title: '续费率稳定', content: '连续三个季度稳定', asset_name: null, image_paths: [] },
    });
  });

  it('rejects invalid material types and more than three images', () => {
    expect(normalizeResearchMaterialInput({ material_type: 'other', title: 'x', content: 'y' } as never).ok).toBe(false);
    expect(normalizeResearchMaterialInput({
      material_type: 'news', title: 'x', content: 'y', image_paths: ['1', '2', '3', '4'],
    }).ok).toBe(false);
  });

  it('normalizes simple list filters', () => {
    const params = new URL('https://local/api?q= 腾讯 &type=news&asset_name=腾讯').searchParams;
    expect(normalizeMaterialFilters(params)).toEqual({ query: '腾讯', materialType: 'news', assetName: '腾讯' });
  });

  it('escapes characters used by the Supabase filter grammar', () => {
    expect(buildMaterialSearchTerm('增长率_10%,海外')).toBe('增长率\\_10\\%\\,海外');
  });
});
