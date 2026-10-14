import { describe, expect, it, vi } from 'vitest';
import { clearBrowserFormDraft, loadBrowserFormDraft, saveBrowserFormDraft } from './browser-form-draft';

describe('browser form drafts', () => {
  it('isolates drafts by their complete key', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    saveBrowserFormDraft('draft:user-a:journal:new', { title: 'A' });
    expect(loadBrowserFormDraft('draft:user-a:journal:new')).toEqual({ title: 'A' });
    expect(loadBrowserFormDraft('draft:user-b:journal:new')).toBeNull();
  });

  it('keeps a draft until it is explicitly cleared', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    saveBrowserFormDraft('draft:user-a:method:1', { content: '未保存' });
    expect(loadBrowserFormDraft('draft:user-a:method:1')).toEqual({ content: '未保存' });
    clearBrowserFormDraft('draft:user-a:method:1');
    expect(loadBrowserFormDraft('draft:user-a:method:1')).toBeNull();
  });

  it('ignores malformed browser data', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{bad', setItem: vi.fn(), removeItem: vi.fn() });
    expect(loadBrowserFormDraft('draft:user-a:journal:new')).toBeNull();
  });
});
