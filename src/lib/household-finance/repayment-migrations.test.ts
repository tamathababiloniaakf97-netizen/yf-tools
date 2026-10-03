import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('household repayment database functions', () => {
  it('use the PostgreSQL UUID generator available inside restricted function search paths', () => {
    for (const migration of ['015_household_entry_debt_workflows.sql', '022_household_batch_repayments.sql']) {
      const sql = readFileSync(join(process.cwd(), 'supabase', 'migrations', migration), 'utf8');
      expect(sql).not.toContain('uuid_generate_v4()');
      expect(sql).toContain('gen_random_uuid()');
    }
  });
});
