import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJson } from './fetch-json';

describe('fetchJson', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns decoded JSON for a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ value: 42 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    await expect(fetchJson<{ value: number }>('/api/example')).resolves.toEqual({ value: 42 });
  });

  it('throws the API error message for an unsuccessful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: '读取失败' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    await expect(fetchJson('/api/example')).rejects.toThrow('读取失败');
  });
});
