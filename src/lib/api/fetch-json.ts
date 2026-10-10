export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({})) as { error?: string };

  if (!response.ok) {
    throw new Error(body.error || `请求失败（${response.status}）`);
  }

  return body as T;
}
