export function browserFormDraftKey(userId: string | undefined, form: string, record: string) {
  return userId ? `life-os:draft:${userId}:${form}:${record}` : '';
}

export function loadBrowserFormDraft<T>(key: string): T | null {
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
}

export function saveBrowserFormDraft(key: string, values: unknown) {
  if (!key || typeof localStorage === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(values)); } catch { /* storage unavailable or full */ }
}

export function clearBrowserFormDraft(key: string) {
  if (!key || typeof localStorage === 'undefined') return;
  try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
}
