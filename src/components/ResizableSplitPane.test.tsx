import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import ResizableSplitPane from './ResizableSplitPane';

function renderPane(storageKey = 'journal-width') {
  const result = render(
    <ResizableSplitPane
      className="test-shell"
      storageKey={storageKey}
      defaultLeftWidth={420}
      minLeftWidth={280}
      maxLeftWidth={600}
    >
      <aside>列表</aside>
      <main>正文</main>
    </ResizableSplitPane>,
  );
  return {
    ...result,
    root: result.container.firstElementChild as HTMLElement,
    divider: screen.getByRole('separator', { name: '调整列表宽度' }),
  };
}

beforeEach(() => localStorage.clear());

describe('ResizableSplitPane', () => {
  it('exposes an accessible separator and starts at the default width', () => {
    const { root, divider } = renderPane();

    expect(root).toHaveClass('resizable-split-pane', 'test-shell');
    expect(root.style.getPropertyValue('--split-left-width')).toBe('420px');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    expect(divider).toHaveAttribute('aria-valuemin', '280');
    expect(divider).toHaveAttribute('aria-valuemax', '600');
    expect(divider).toHaveAttribute('aria-valuenow', '420');
  });

  it('restores a valid saved width and ignores malformed saved data', async () => {
    localStorage.setItem('journal-width', '512');
    const valid = renderPane();
    await waitFor(() => expect(valid.root.style.getPropertyValue('--split-left-width')).toBe('512px'));
    valid.unmount();

    localStorage.setItem('journal-width', 'not-a-number');
    const invalid = renderPane();
    expect(invalid.root.style.getPropertyValue('--split-left-width')).toBe('420px');
  });

  it('drags within bounds and saves only after the drag ends', () => {
    const { root, divider } = renderPane();

    fireEvent.pointerDown(divider, { clientX: 420, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 800, pointerId: 1 });
    expect(root.style.getPropertyValue('--split-left-width')).toBe('600px');
    expect(localStorage.getItem('journal-width')).toBeNull();

    fireEvent.pointerMove(window, { clientX: 0, pointerId: 1 });
    expect(root.style.getPropertyValue('--split-left-width')).toBe('280px');
    fireEvent.pointerUp(window, { pointerId: 1 });

    expect(localStorage.getItem('journal-width')).toBe('280');
  });

  it('supports keyboard resizing and reset shortcuts', () => {
    const { root, divider } = renderPane();

    fireEvent.keyDown(divider, { key: 'ArrowRight' });
    expect(root.style.getPropertyValue('--split-left-width')).toBe('436px');
    expect(localStorage.getItem('journal-width')).toBe('436');

    fireEvent.keyDown(divider, { key: 'Home' });
    expect(root.style.getPropertyValue('--split-left-width')).toBe('280px');
    fireEvent.keyDown(divider, { key: 'End' });
    expect(root.style.getPropertyValue('--split-left-width')).toBe('600px');

    fireEvent.doubleClick(divider);
    expect(root.style.getPropertyValue('--split-left-width')).toBe('420px');
    expect(localStorage.getItem('journal-width')).toBe('420');
  });
});
