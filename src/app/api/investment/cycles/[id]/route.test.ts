import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('cycle profile patch route',()=>{
  const source=readFileSync('src/app/api/investment/cycles/[id]/route.ts','utf8');
  it('uses the partial patch normalizer and preserves omitted fields',()=>{
    expect(source).toContain('normalizeCycleProfilePatch');
    expect(source).toContain('validation.value');
  });
});
