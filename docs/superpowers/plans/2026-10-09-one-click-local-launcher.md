# One-Click Local Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a double-click Windows launcher that starts the local development server when needed and opens the investment overview.

**Architecture:** A root `.cmd` file delegates to a PowerShell helper using the launcher location, so invocation is independent of the current directory. The helper checks the application URL, starts `npm.cmd` in a hidden process only when needed, polls for readiness, opens the default browser, and shows a Windows error dialog on timeout.

**Tech Stack:** Windows batch, Windows PowerShell 5+, npm, Next.js development server, Vitest

---

### Task 1: Lock launcher structure with a failing test

**Files:**
- Create: `scripts/start-life-workbench.test.ts`
- Create: `一键启动人生工作台.cmd`
- Create: `scripts/start-life-workbench.ps1`

- [ ] **Step 1: Write a source-contract test before creating launcher files**

```ts
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
    expect(script).toContain("http://localhost:3000/investment");
    expect(script).toContain("Start-Process -FilePath 'npm.cmd'");
    expect(script).toContain("-WindowStyle Hidden");
    expect(script).toContain('for ($attempt = 1; $attempt -le 30; $attempt++)');
    expect(script).toContain('Start-Process $AppUrl');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails because the launcher files do not exist**

Run: `npm test -- scripts/start-life-workbench.test.ts`

Expected: FAIL with `ENOENT` for `一键启动人生工作台.cmd`.

### Task 2: Implement and verify the launcher

**Files:**
- Create: `一键启动人生工作台.cmd`
- Create: `scripts/start-life-workbench.ps1`
- Test: `scripts/start-life-workbench.test.ts`

- [ ] **Step 1: Add the root batch entry point**

```bat
@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0scripts\start-life-workbench.ps1"
```

- [ ] **Step 2: Add the PowerShell startup helper**

```powershell
param([switch]$SkipBrowser)

$ErrorActionPreference = 'Stop'
$AppUrl = 'http://localhost:3000/investment'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Test-AppReady {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $AppUrl -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  } catch {
    return $false
  }
}

if (Test-AppReady) {
  if (-not $SkipBrowser) { Start-Process $AppUrl }
  Write-Output 'already-running'
  exit 0
}

Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev', '--', '--port', '3000') -WorkingDirectory $ProjectRoot -WindowStyle Hidden

for ($attempt = 1; $attempt -le 30; $attempt++) {
  Start-Sleep -Seconds 1
  if (Test-AppReady) {
    if (-not $SkipBrowser) { Start-Process $AppUrl }
    Write-Output 'started'
    exit 0
  }
}

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show(
  "人生工作台未能在 30 秒内启动。请检查 Node.js、项目依赖，或确认 3000 端口未被其他程序占用。",
  '人生工作台启动失败',
  [System.Windows.Forms.MessageBoxButtons]::OK,
  [System.Windows.Forms.MessageBoxIcon]::Error
) | Out-Null
exit 1
```

- [ ] **Step 3: Run the source-contract test**

Run: `npm test -- scripts/start-life-workbench.test.ts`

Expected: 2 tests pass.

- [ ] **Step 4: Verify the already-running path against the current server**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-life-workbench.ps1 -SkipBrowser`

Expected: exit code 0 and output `already-running`; no second `next dev --port 3000` process is created.

- [ ] **Step 5: Run lint and production build**

Run: `npx eslint scripts/start-life-workbench.test.ts`

Expected: exit code 0.

Run: `npm run build`

Expected: Next.js build exits with code 0.

- [ ] **Step 6: Commit launcher files**

```bash
git add scripts/start-life-workbench.test.ts scripts/start-life-workbench.ps1 "一键启动人生工作台.cmd"
git commit -m "feat: add one-click local launcher"
```
