import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('desktop sidebar layout', () => {
  it('keeps navigation in the viewport and scrolls long menus independently', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');
    expect(css).toMatch(/\.life-os-sider\s*\{[^}]*position:\s*sticky[^}]*height:\s*100vh/);
    expect(css).toMatch(/\.life-os-sidebar\s*\{[^}]*height:\s*100%[^}]*overflow-y:\s*auto/);
  });
});
