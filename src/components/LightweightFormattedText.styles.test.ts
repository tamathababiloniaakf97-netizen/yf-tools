import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('LightweightFormattedText heading styles', () => {
  it('gives small headings a visible hierarchy without extra top space at the start', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');
    expect(css).toMatch(/\.lightweight-formatted-heading\s*\{[^}]*font-size:\s*1\.2rem/);
    expect(css).toMatch(/\.lightweight-formatted-heading\s*\{[^}]*font-weight:\s*650/);
    expect(css).toMatch(/\.lightweight-formatted-heading:first-child\s*\{[^}]*margin-top:\s*0/);
  });
});
