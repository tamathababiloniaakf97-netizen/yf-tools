import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('cognition migration', () => {
  const sql = readFileSync('supabase/migrations/028_cognition_improvement.sql', 'utf8');
  const permissionsSql = readFileSync('supabase/migrations/029_cognition_permissions.sql', 'utf8');

  it('creates the three user-owned cognition tables with RLS', () => {
    expect(sql).toContain('create table if not exists public.cognition_categories');
    expect(sql).toContain('create table if not exists public.cognition_journals');
    expect(sql).toContain('create table if not exists public.cognition_methods');
    expect(sql.match(/enable row level security/g)).toHaveLength(3);
    expect(sql).toContain('method_id uuid references public.cognition_methods');
    expect(sql).toContain('unique (user_id, name)');
  });

  it('grants authenticated users access before RLS policies are evaluated', () => {
    expect(permissionsSql).toContain('grant select, insert, update, delete on table');
    expect(permissionsSql).toContain('to authenticated');
    expect(permissionsSql).toContain('cognition_categories');
    expect(permissionsSql).toContain('cognition_journals');
    expect(permissionsSql).toContain('cognition_methods');
  });
});
