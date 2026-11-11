import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/create/route';
import { initDb } from '@/lib/db';

const makeReq = (fields: Record<string, string>) => {
  const body = new URLSearchParams(fields);
  return new Request('http://localhost/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
};

describe('POST /create (form fallback, no fetch/XHR)', () => {
  beforeEach(async () => {
    await initDb();
  });

  it('creates an event and redirects (303) to the event page', async () => {
    const res = await POST(
      makeReq({
        title: '프로젝트 회식',
        description: '',
        startDate: '2026-11-16',
        endDate: '2026-12-23',
        password: '1234',
      })
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toMatch(/\/event\/[a-z0-9]+$/);
  });

  it('redirects back to home with an error message on invalid input', async () => {
    const res = await POST(
      makeReq({ title: '', startDate: '2026-11-16', endDate: '2026-11-18', password: '1234' })
    );
    expect(res.status).toBe(303);
    const loc = new URL(res.headers.get('location')!);
    expect(loc.pathname).toBe('/');
    expect(loc.searchParams.get('error')).toMatch(/제목/);
  });
});
