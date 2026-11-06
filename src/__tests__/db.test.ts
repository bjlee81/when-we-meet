import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createEvent, 
  getEventById, 
  updateEventDetails,
  deleteEventWithPassword, 
  submitVote, 
  initDb,
  getAllEventsForAdmin,
  adminForceDeleteEvent,
  getSiteSettings,
  updateSiteSettings,
  cleanupExpiredEvents
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

  it('manages master admin settings and all events list', async () => {
    // 1. 전역 광고 설정 저장 및 조회
    await updateSiteSettings({
      ad_enabled: 'true',
      ad_kakao_unit_id: 'DAN-TEST1234',
      ad_google_client_id: 'ca-pub-99999999',
    });

    const settings = await getSiteSettings();
    expect(settings.ad_enabled).toBe('true');
    expect(settings.ad_kakao_unit_id).toBe('DAN-TEST1234');
    expect(settings.ad_google_client_id).toBe('ca-pub-99999999');

    // 2. 관리자용 전체 모임 조회
    const all = await getAllEventsForAdmin();
    expect(all.length).toBeGreaterThan(0);

    // 3. 관리자 마스터 강제 삭제
    const targetId = all[0].id;
    const deleted = await adminForceDeleteEvent(targetId);
    expect(deleted).toBe(true);

    const checked = await getEventById(targetId);
    expect(checked).toBeNull();
  });

  it('automatically cleans up events past end date and inactive zero-participant rooms', async () => {
    // 1. 이미 지난 과거 일정 생성 (종료일: 2020-01-01)
    const oldEvent = await createEvent({
      title: '과거 지난 모임',
      description: '옛날 모임',
      startDate: '2019-12-25',
      endDate: '2020-01-01',
      password: 'pass',
    });

    // 2. 미래의 정상 일정 생성 (종료일: 2030-01-01)
    const futureEvent = await createEvent({
      title: '미래 모임',
      description: '앞으로 있을 모임',
      startDate: '2029-12-25',
      endDate: '2030-01-01',
      password: 'pass',
    });

    // 3. 만료 정리 함수 실행 (기준일: 2026-11-06)
    const cleanupResult = await cleanupExpiredEvents('2026-11-06');
    expect(cleanupResult.deletedCount).toBeGreaterThanOrEqual(1);

    // 과거 일정은 삭제되었어야 함
    const checkOld = await getEventById(oldEvent.id);
    expect(checkOld).toBeNull();

    // 미래 일정은 유지되어야 함
    const checkFuture = await getEventById(futureEvent.id);
    expect(checkFuture).not.toBeNull();
    expect(checkFuture?.title).toBe('미래 모임');
  });
});
