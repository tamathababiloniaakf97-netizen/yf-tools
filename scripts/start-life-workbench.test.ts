import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');

describe('one-click local launcher', () => {
  it('delegates from the root cmd file using its own directory', () => {
    const cmd = readFileSync(resolve(root, '一键启动人生工作台.cmd'), 'utf8');

    expect(cmd).toContain('%~dp0scripts\\start-life-workbench.ps1');
    expect(cmd).toContain('-WindowStyle Hidden');
  });

  it('checks readiness, avoids duplicate startup, and opens the investment page', () => {
    const script = readFileSync(resolve(root, 'scripts/start-life-workbench.ps1'), 'utf8');

    expect(script).toContain('http://localhost:3000/investment');
    expect(script).toContain("Start-Process -FilePath 'npm.cmd'");
    expect(script).toContain('-WindowStyle Hidden');
    expect(script).toContain('for ($attempt = 1; $attempt -le 30; $attempt++)');
    expect(script).toContain('Start-Process $AppUrl');
  });

  it('remains parseable by Windows PowerShell without relying on a UTF-8 BOM', () => {
    const script = readFileSync(resolve(root, 'scripts/start-life-workbench.ps1'), 'utf8');

    expect([...script].every((character) => character.charCodeAt(0) <= 127)).toBe(true);
  });
});
