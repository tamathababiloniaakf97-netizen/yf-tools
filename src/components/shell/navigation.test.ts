import { describe, expect, it } from 'vitest';
import { lifeOsNavigation } from './navigation';

describe('lifeOsNavigation', () => {
  it('keeps the existing holdings route and excludes retired product routes', () => {
    const paths = lifeOsNavigation.flatMap((item) => [
      item.href,
      ...(item.children ?? []).map((child) => child.href),
    ]);

    expect(paths).toContain('/cost');
    expect(paths).toContain('/relationships');
    expect(paths).not.toContain('/strategy');
    expect(paths).not.toContain('/execution');
    expect(paths).not.toContain('/about');
    expect(paths).not.toContain('/plans');
    expect(lifeOsNavigation.map((item) => item.label)).not.toContain('计划管理');
  });

  it('makes life reinforcement available while keeping global review for later', () => {
    const life = lifeOsNavigation.find((item) => item.key === 'life');
    const futureItems = lifeOsNavigation.filter((item) => item.phase === 'later');

    expect(life).toMatchObject({ href: '/life', disabled: false, phase: 'now' });
    expect(futureItems.map((item) => item.label)).toEqual(['全局复盘']);
    expect(futureItems.every((item) => item.disabled)).toBe(true);
  });

  it('makes the shared investment task view available', () => {
    const investment = lifeOsNavigation.find((item) => item.key === 'investment');
    const tasks = investment?.children?.find((item) => item.key === 'investment-tasks');

    expect(tasks).toMatchObject({ href: '/investment/tasks', disabled: false, phase: 'now' });
  });

  it('makes investment review and methodology available in the MVP', () => {
    const investment = lifeOsNavigation.find((item) => item.key === 'investment');
    const children = investment?.children ?? [];

    expect(children.find((item) => item.key === 'investment-reviews')).toMatchObject({ disabled: false, phase: 'now' });
    expect(children.find((item) => item.key === 'methodology')).toMatchObject({ disabled: false, phase: 'now' });
  });

  it('makes investment decisions available next to company research', () => {
    const investment = lifeOsNavigation.find((item) => item.key === 'investment');
    expect(investment?.children?.find((item) => item.key === 'investment-decisions')).toMatchObject({
      label: '投资决策', href: '/investment/decisions', disabled: false, phase: 'now',
    });
  });

  it('makes the research library available', () => {
    const investment = lifeOsNavigation.find((item) => item.key === 'investment');
    expect(investment?.children?.find((item) => item.key === 'research-materials')).toMatchObject({
      label: '研究资料库', href: '/investment/materials', disabled: false, phase: 'now',
    });
  });

  it('orders investment navigation from overview and current holdings into attention, research, and review', () => {
    const investment = lifeOsNavigation.find((item) => item.key === 'investment');
    expect(investment?.children?.map((item) => item.key)).toEqual([
      'investment-overview', 'holdings', 'watchlist', 'investment-tasks',
      'research', 'investment-decisions', 'investment-reviews', 'methodology', 'research-materials',
    ]);
  });
});
