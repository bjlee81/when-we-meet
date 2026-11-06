import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createEvent, 
  getEventById, 
  updateEventDetails,
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

    // 4. 브라우저/기기 고유 토큰(Device Token) 기반 무암호 인증 테스트
    const resDevice1 = await submitVote(event.id, {
      participantName: '영희',
      deviceToken: 'device-token-abc',
      availableDates: ['2026-11-14'],
      maybeDates: [],
    });
    expect(resDevice1.success).toBe(true);

    // 동일 기기에서 수정 시도 -> 비밀번호 없이도 자동 인증 성공
    const resDevice1Update = await submitVote(event.id, {
      participantName: '영희',
      deviceToken: 'device-token-abc',
      availableDates: ['2026-11-14', '2026-11-15'],
      maybeDates: [],
    });
    expect(resDevice1Update.success).toBe(true);

    // 다른 기기(다른 브라우저)에서 같은 이름으로 덮어쓰기 시도 -> 차단
    const resDevice2Spoof = await submitVote(event.id, {
      participantName: '영희',
      deviceToken: 'device-token-xyz',
      availableDates: ['2026-11-14'],
      maybeDates: [],
    });
    expect(resDevice2Spoof.success).toBe(false);
    expect(resDevice2Spoof.error).toMatch(/기기|브라우저|PIN/);
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

  it('updates event location and description with host password', async () => {
    const event = await createEvent({
      title: '장소 확정 테스트',
      description: '아직 미정',
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      password: 'hostpassword',
    });

    // 1. 잘못된 비밀번호로 수정 시도 -> 실패
    const failUpdate = await updateEventDetails(event.id, {
      description: '강남역 11번 출구 고기집',
      location: '강남역 맛있는삼겹살',
      password: 'wrongpassword',
    });
    expect(failUpdate.success).toBe(false);
    expect(failUpdate.error).toMatch(/비밀번호/);

    // 2. 올바른 비밀번호로 수정 시도 -> 성공
    const okUpdate = await updateEventDetails(event.id, {
      description: '강남역 11번 출구 맛집 7시 모임 확정!',
      location: '강남역 11번출구',
      password: 'hostpassword',
    });
    expect(okUpdate.success).toBe(true);

    const updated = await getEventById(event.id);
    expect(updated?.description).toBe('강남역 11번 출구 맛집 7시 모임 확정!');
    expect(updated?.location).toBe('강남역 11번출구');
  });
});
