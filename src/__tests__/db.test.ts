import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createEvent, 
  getEventById, 
  deleteEventWithPassword, 
  submitVote, 
  initDb 
} from '@/lib/db';

describe('Database / Storage Operations', () => {
  beforeEach(async () => {
    await initDb();
  });

  it('creates and retrieves an event session', async () => {
    const newEvent = await createEvent({
      title: '친구들 연말 파티',
      description: '강남 또는 홍대',
      startDate: '2026-12-20',
      endDate: '2026-12-25',
      password: 'mypassword123',
    });

    expect(newEvent.id).toBeDefined();
    expect(newEvent.title).toBe('친구들 연말 파티');

    const retrieved = await getEventById(newEvent.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('친구들 연말 파티');
    expect(retrieved?.dates.length).toBeGreaterThan(0);
  });

  it('records participant votes', async () => {
    const event = await createEvent({
      title: '등산 모임',
      description: '북한산',
      startDate: '2026-11-14',
      endDate: '2026-11-15',
      password: 'pass',
    });

    const vote1 = await submitVote(event.id, {
      participantName: '철수',
      availableDates: ['2026-11-14'],
      maybeDates: ['2026-11-15'],
    });

    expect(vote1.participantName).toBe('철수');

    const updatedEvent = await getEventById(event.id);
    expect(updatedEvent?.votes.length).toBe(1);
    expect(updatedEvent?.votes[0].participantName).toBe('철수');
    expect(updatedEvent?.votes[0].availableDates).toEqual(['2026-11-14']);
  });

  it('fails to delete with wrong password, succeeds with correct password', async () => {
    const event = await createEvent({
      title: '삭제 테스트',
      description: '',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      password: 'secret_1234',
    });

    const wrongDelete = await deleteEventWithPassword(event.id, 'wrong_pass');
    expect(wrongDelete.success).toBe(false);
    expect(wrongDelete.error).toMatch(/비밀번호/);

    const rightDelete = await deleteEventWithPassword(event.id, 'secret_1234');
    expect(rightDelete.success).toBe(true);

    const deletedEvent = await getEventById(event.id);
    expect(deletedEvent).toBeNull();
  });
});
