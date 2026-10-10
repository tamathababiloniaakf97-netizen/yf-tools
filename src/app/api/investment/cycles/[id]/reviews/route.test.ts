import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('cycle review write order',()=>{
  const source=readFileSync('src/app/api/investment/cycles/[id]/reviews/route.ts','utf8');
  it('updates the current profile before inserting its history snapshot',()=>{
    expect(source.indexOf("from('market_cycle_profiles').update")).toBeGreaterThan(-1);
    expect(source.indexOf("from('market_cycle_profiles').update")).toBeLessThan(source.indexOf("from('market_cycle_reviews').insert"));
  });
});
