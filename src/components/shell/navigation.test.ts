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
  });

  it('marks later modules as unavailable without hiding their direction', () => {
    const futureItems = lifeOsNavigation.filter((item) => item.phase === 'later');

    expect(futureItems.map((item) => item.label)).toEqual(['生活补强', '全局复盘']);
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
});
