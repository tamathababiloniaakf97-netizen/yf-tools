'use client';

import { type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';

type ResizableSplitPaneProps = {
  children: [ReactNode, ReactNode];
  className?: string;
  storageKey: string;
  defaultLeftWidth: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
};

type SplitPaneStyle = CSSProperties & { '--split-left-width': string };

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

export default function ResizableSplitPane({
  children,
  className = '',
  storageKey,
  defaultLeftWidth,
  minLeftWidth = 280,
  maxLeftWidth = 600,
}: ResizableSplitPaneProps) {
  const safeDefault = clamp(defaultLeftWidth, minLeftWidth, maxLeftWidth);
  const [leftWidth, setLeftWidth] = useState(safeDefault);
  const [dragging, setDragging] = useState(false);
  const widthRef = useRef(safeDefault);
  const dragRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const saved = Number(window.localStorage.getItem(storageKey));
        if (Number.isFinite(saved) && saved > 0) {
          const nextWidth = clamp(saved, minLeftWidth, maxLeftWidth);
          widthRef.current = nextWidth;
          setLeftWidth(nextWidth);
        }
      } catch {
        // The layout remains usable when browser storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [maxLeftWidth, minLeftWidth, storageKey]);

  useEffect(() => () => document.body.classList.remove('is-resizing-split'), []);

  const updateWidth = (value: number) => {
    const nextWidth = clamp(value, minLeftWidth, maxLeftWidth);
    widthRef.current = nextWidth;
    setLeftWidth(nextWidth);
    return nextWidth;
  };

  const persist = (value: number) => {
    try {
      window.localStorage.setItem(storageKey, String(value));
    } catch {
      // A blocked localStorage must not block resizing.
    }
  };

  const finishDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    document.body.classList.remove('is-resizing-split');
    persist(widthRef.current);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: widthRef.current };
    setDragging(true);
    document.body.classList.add('is-resizing-split');

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || moveEvent.pointerId !== drag.pointerId) return;
      updateWidth(drag.startWidth + moveEvent.clientX - drag.startX);
    };
    const handlePointerEnd = (endEvent: globalThis.PointerEvent) => {
      if (dragRef.current?.pointerId !== endEvent.pointerId) return;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      finishDrag();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
  };

  const setAndPersist = (value: number) => persist(updateWidth(value));

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const widths: Partial<Record<string, number>> = {
      ArrowLeft: leftWidth - 16,
      ArrowRight: leftWidth + 16,
      Home: minLeftWidth,
      End: maxLeftWidth,
    };
    const nextWidth = widths[event.key];
    if (nextWidth === undefined) return;
    event.preventDefault();
    setAndPersist(nextWidth);
  };

  const style: SplitPaneStyle = { '--split-left-width': `${leftWidth}px` };

  return (
    <div className={`resizable-split-pane ${className}`.trim()} data-storage-key={storageKey} style={style}>
      {children[0]}
      <div
        aria-label="调整列表宽度"
        aria-orientation="vertical"
        aria-valuemax={maxLeftWidth}
        aria-valuemin={minLeftWidth}
        aria-valuenow={leftWidth}
        className={`resizable-split-divider ${dragging ? 'is-dragging' : ''}`.trim()}
        onDoubleClick={() => setAndPersist(safeDefault)}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        role="separator"
        tabIndex={0}
      />
      {children[1]}
    </div>
  );
}
