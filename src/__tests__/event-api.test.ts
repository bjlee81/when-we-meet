import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getEvent } from '@/app/api/events/[id]/route';
import { createEvent, initDb } from '@/lib/db';

describe('GET /api/events/[id] & Alias API Contract', () => {
  beforeEach(async () => {
    await initDb();
  });

  it('returns success: true along with event data', async () => {
    const created = await createEvent({
      title: '계약 검증 모임',
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      password: 'pass',
    });

    const req = new Request(`http://localhost/api/events/${created.id}`);
    const res = await getEvent(req, { params: Promise.resolve({ id: created.id }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    // 프론트엔드가 data.success를 검증하므로 반드시 true여야 함
    expect(data.success).toBe(true);
    expect(data.event).toBeDefined();
    expect(data.event.id).toBe(created.id);
    expect(data.event.title).toBe('계약 검증 모임');
  });
});
