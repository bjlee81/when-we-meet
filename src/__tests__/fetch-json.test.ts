import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchJsonWithRetry } from '@/lib/fetch-json';

const ok = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('fetchJsonWithRetry', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns parsed response on first success', async () => {
    const f = vi.fn().mockResolvedValue(ok({ success: true }));
    vi.stubGlobal('fetch', f);
    const res = await fetchJsonWithRetry('/api/x', { method: 'POST' }, { retryDelayMs: 0 });
    expect(res.data).toEqual({ success: true });
    expect(res.ok).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('retries on network failure (TypeError) and then succeeds', async () => {
    const f = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(ok({ success: true }));
    vi.stubGlobal('fetch', f);
    const res = await fetchJsonWithRetry('/api/x', {}, { retryDelayMs: 0 });
    expect(res.ok).toBe(true);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('does not retry on HTTP error responses', async () => {
    const f = vi.fn().mockResolvedValue(ok({ error: '잘못됨' }, 400));
    vi.stubGlobal('fetch', f);
    const res = await fetchJsonWithRetry('/api/x', {}, { retryDelayMs: 0 });
    expect(res.ok).toBe(false);
    expect(res.data.error).toBe('잘못됨');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('throws a friendly Korean message after retries are exhausted', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', f);
    await expect(
      fetchJsonWithRetry('/api/x', {}, { retries: 2, retryDelayMs: 0 })
    ).rejects.toThrow(/네트워크 연결/);
    expect(f).toHaveBeenCalledTimes(3);
  });
});
