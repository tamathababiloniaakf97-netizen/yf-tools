# Life Reinforcement Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable a static `/life` page that explains four practical life-reinforcement routes without introducing storage, scoring, tracking, or AI features.

**Architecture:** Keep the feature as one Next.js App Router page rendered inside the existing authenticated application shell. Store the four routes as local page constants, render them with Ant Design cards and Next.js links, and change only the existing navigation configuration to make `/life` available.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Vitest, Testing Library

---

### Task 1: Enable the navigation entry

**Files:**
- Modify: `src/components/shell/navigation.test.ts`
- Modify: `src/components/shell/navigation.ts`

- [ ] **Step 1: Write the failing navigation test**

Replace the later-module assertion with separate expectations so that life is current and global review remains later:

```ts
it('makes life reinforcement available while keeping global review for later', () => {
  const life = lifeOsNavigation.find((item) => item.key === 'life');
  const futureItems = lifeOsNavigation.filter((item) => item.phase === 'later');

  expect(life).toMatchObject({ href: '/life', disabled: false, phase: 'now' });
  expect(futureItems.map((item) => item.label)).toEqual(['全局复盘']);
  expect(futureItems.every((item) => item.disabled)).toBe(true);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/components/shell/navigation.test.ts`

Expected: FAIL because the `life` item is still disabled and marked `later`.

- [ ] **Step 3: Apply the minimal navigation change**

Change the life item in `lifeOsNavigation` to:

```ts
{ key: 'life', label: '生活补强', href: '/life', icon: 'life', disabled: false, phase: 'now' },
```

- [ ] **Step 4: Run the focused test and verify success**

Run: `npm test -- src/components/shell/navigation.test.ts`

Expected: all navigation tests PASS.

- [ ] **Step 5: Commit the navigation change**

```bash
git add src/components/shell/navigation.ts src/components/shell/navigation.test.ts
git commit -m "feat: enable life reinforcement navigation"
```

### Task 2: Add the static life-reinforcement page

**Files:**
- Create: `src/app/life/page.test.tsx`
- Create: `src/app/life/page.tsx`

- [ ] **Step 1: Write the failing page test**

Create a test that mocks `AuthGuard`, renders the page, and locks the approved scope:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LifePage from './page';

vi.mock('@/components/AuthGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LifePage', () => {
  it('shows the four approved reinforcement routes and their stages', () => {
    render(<LifePage />);

    expect(screen.getByRole('heading', { name: '生活补强' })).toBeInTheDocument();
    expect(screen.getByText('表达能力')).toBeInTheDocument();
    expect(screen.getByText('人际关系')).toBeInTheDocument();
    expect(screen.getByText('形象管理与审美')).toBeInTheDocument();
    expect(screen.getByText('组织能力')).toBeInTheDocument();
    expect(screen.getByText('结构化表达 → 短视频实战 → 真实对话')).toBeInTheDocument();
    expect(screen.queryByText('健康管理')).not.toBeInTheDocument();
  });

  it('provides practical methods and reuses existing execution routes', () => {
    render(<LifePage />);

    expect(screen.getByText(/希望听众记住什么/)).toBeInTheDocument();
    expect(screen.getByText(/每周选择一位值得维护的联系人/)).toBeInTheDocument();
    expect(screen.getByText(/日常、工作和正式场景/)).toBeInTheDocument();
    expect(screen.getByText(/30 分钟内可启动/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '去年度目标' })).toHaveAttribute('href', '/goals');
    expect(screen.getByRole('link', { name: '去计划管理' })).toHaveAttribute('href', '/plans');
    expect(screen.queryByText(/评分|打卡|解锁/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/app/life/page.test.tsx`

Expected: FAIL because `src/app/life/page.tsx` does not exist.

- [ ] **Step 3: Implement the minimal static page**

Create `src/app/life/page.tsx` as a client component. Define an in-file `reinforcementItems` constant with the four approved titles, goals, three-stage strings, and practical methods from the design specification. Render:

```tsx
'use client';

import { Button, Card, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

const reinforcementItems = [
  {
    title: '表达能力',
    goal: '让听众能迅速理解并记住重点，而不是追求听起来流利。',
    stages: ['结构化表达', '短视频实战', '真实对话'],
    method: '每次先写一句“希望听众记住什么”，再按“结论—两个理由—一个例子—重申结论”完成 3 分钟表达。每周练习 4 次，周末完成一次不看完整逐字稿的阶段作品。',
  },
  {
    title: '人际关系',
    goal: '记住对方的真实近况，并用具体行动延续关系，而不是追求联系人数量。',
    stages: ['记住重要信息', '主动联系', '深度交流与持续跟进'],
    method: '每周选择一位值得维护的联系人，回看已记录的近况，准备一个与对方真实情况有关的问题。联系后只记录对方实际表达的事实和自己的下一步行动。',
  },
  {
    title: '形象管理与审美',
    goal: '用稳定、可重复的方案满足不同场景，而不是频繁购买或追逐潮流。',
    stages: ['基础整洁', '场景穿搭', '审美判断与稳定风格'],
    method: '建立出门前检查清单，再用现有衣物分别固定日常、工作和正式场景各一套可重复搭配。只在无法覆盖明确场景时才列出购买项。',
  },
  {
    title: '组织能力',
    goal: '把想法转化为可启动、可检查的行动，而不是扩充更多待办。',
    stages: ['明确结果', '拆解行动', '推进与复盘'],
    method: '创建计划前先写出可验证的完成标准，再把第一步缩小为 30 分钟内可启动的动作。每周最多设置三项本周重点，周末检查完成、阻塞、取消或继续。',
  },
] as const;
```

Map each item to a `Card` whose title is the route title, whose body contains `补强目标`, a stage row rendered as `${item.stages.join(' → ')}`, and `开始方法`. Below the grid render two `Link`-wrapped buttons for `/goals` and `/plans`, followed by the exact boundary sentence from the specification.

- [ ] **Step 4: Run the focused page test and verify success**

Run: `npm test -- src/app/life/page.test.tsx`

Expected: both page tests PASS.

- [ ] **Step 5: Commit the static page**

```bash
git add src/app/life/page.tsx src/app/life/page.test.tsx
git commit -m "feat: add practical life reinforcement routes"
```

### Task 3: Verify the complete change

**Files:**
- Verify: `src/components/shell/navigation.ts`
- Verify: `src/components/shell/navigation.test.ts`
- Verify: `src/app/life/page.tsx`
- Verify: `src/app/life/page.test.tsx`

- [ ] **Step 1: Run both focused test suites**

Run: `npm test -- src/components/shell/navigation.test.ts src/app/life/page.test.tsx`

Expected: all focused tests PASS.

- [ ] **Step 2: Run static verification**

Run: `npm run typecheck`

Expected: exit code 0.

Run: `npx eslint src/components/shell/navigation.ts src/components/shell/navigation.test.ts src/app/life/page.tsx src/app/life/page.test.tsx`

Expected: exit code 0 with no errors.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`

Expected: all project tests PASS. If an unrelated pre-existing test fails, record the exact failure and confirm the focused tests remain green rather than changing unrelated code.

- [ ] **Step 4: Perform browser verification**

Open `/life` in the existing local development server and verify:

- The sidebar item is enabled and selected on `/life`.
- All four cards are readable without horizontal overflow at desktop width.
- The cards stack in a readable order at a narrow mobile viewport.
- The two links navigate to `/goals` and `/plans`.
- No scoring, progress, upload, AI analysis, health advice, or stage-unlock control appears.

- [ ] **Step 5: Commit any verification-only fixes**

If verification requires a focused layout or accessibility correction, stage only the four feature files and commit:

```bash
git add src/components/shell/navigation.ts src/components/shell/navigation.test.ts src/app/life/page.tsx src/app/life/page.test.tsx
git commit -m "fix: refine life reinforcement overview"
```

