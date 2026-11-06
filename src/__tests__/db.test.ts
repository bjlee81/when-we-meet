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

  it('records participant votes with PIN and protects modification', async () => {
    const event = await createEvent({
      title: '등산 모임',
      description: '북한산',
      startDate: '2026-11-14',
      endDate: '2026-11-15',
      password: 'pass',
    });

    // 1. 최초 등록 (PIN: '1234')
    const res1 = await submitVote(event.id, {
      participantName: '철수',
      pin: '1234',
      availableDates: ['2026-11-14'],
      maybeDates: ['2026-11-15'],
    });

    expect(res1.success).toBe(true);
    expect(res1.vote?.participantName).toBe('철수');

    // 2. 다른 사람이 틀린 PIN으로 덮어쓰기 시도 -> 실패해야 함
    const resWrongPin = await submitVote(event.id, {
      participantName: '철수',
      pin: '9999',
      availableDates: ['2026-11-15'],
      maybeDates: [],
    });
    expect(resWrongPin.success).toBe(false);
    expect(resWrongPin.error).toMatch(/비밀번호/);

    // 3. 올바른 PIN으로 수정 시도 -> 성공해야 함
    const resRightPin = await submitVote(event.id, {
      participantName: '철수',
      pin: '1234',
      availableDates: ['2026-11-15'],
      maybeDates: [],
    });
    expect(resRightPin.success).toBe(true);

    const updatedEvent = await getEventById(event.id);
    expect(updatedEvent?.votes.length).toBe(1);
    expect(updatedEvent?.votes[0].participantName).toBe('철수');
    expect(updatedEvent?.votes[0].availableDates).toEqual(['2026-11-15']);
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
