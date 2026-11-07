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
  cleanupExpiredEvents,
  getDb
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

  it('automatically adds createdAt column to votes table if missing and allows voting', async () => {
    const db = getDb();
    const event = await createEvent({
      title: '컬럼 누락 마이그레이션 테스트',
      description: '',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      password: 'pass',
    });

    // 1. 구버전 스키마를 시뮬레이션: votes 테이블에서 createdAt 컬럼이 없는 상태로 재생성
    await db.execute(`DROP TABLE IF EXISTS votes;`);
    await db.execute(`
      CREATE TABLE votes (
        id TEXT PRIMARY KEY,
        eventId TEXT NOT NULL,
        participantName TEXT NOT NULL,
        availableDates TEXT NOT NULL,
        maybeDates TEXT NOT NULL,
        FOREIGN KEY(eventId) REFERENCES events(id) ON DELETE CASCADE
      );
    `);

    // 2. initDb() 호출 -> 누락된 createdAt, pinHash, deviceToken 컬럼이 자동 마이그레이션 되어야 함
    await initDb();

    // 3. 첫 번째 참여자가 투표 입력 -> 정상 성공해야 함
    const vote1 = await submitVote(event.id, {
      participantName: '참여자1',
      deviceToken: 'token-user-1',
      availableDates: ['2026-12-01'],
      maybeDates: [],
    });
    expect(vote1.success).toBe(true);

    // 4. 두 번째 참여자가 투표 입력 -> 'table votes has no column named createdAt' 에러 없이 성공해야 함
    const vote2 = await submitVote(event.id, {
      participantName: '참여자2',
      deviceToken: 'token-user-2',
      availableDates: ['2026-12-02'],
      maybeDates: [],
    });
    expect(vote2.success).toBe(true);

    // 5. 첫 번째 참여자가 투표 수정(UPDATE) -> 정상 작동해야 함
    const vote1Update = await submitVote(event.id, {
      participantName: '참여자1',
      deviceToken: 'token-user-1',
      availableDates: ['2026-12-01', '2026-12-03'],
      maybeDates: [],
    });
    expect(vote1Update.success).toBe(true);
  });

  it('works against the exact production votes schema (pin column, nullable createdAt)', async () => {
    const db = getDb();
    const event = await createEvent({
      title: '운영 스키마 재현',
      startDate: '2026-12-10',
      endDate: '2026-12-12',
      password: 'pass',
    });

    await db.execute(`DROP TABLE IF EXISTS votes;`);
    await db.execute(`
      CREATE TABLE votes (
        id TEXT PRIMARY KEY,
        eventId TEXT NOT NULL,
        participantName TEXT NOT NULL,
        pin TEXT,
        deviceToken TEXT,
        availableDates TEXT NOT NULL,
        maybeDates TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        pinHash TEXT,
        createdAt TEXT,
        CONSTRAINT fk_votes_eventId_events_id_fk FOREIGN KEY (eventId) REFERENCES events (id) ON DELETE CASCADE
      );
    `);
    await initDb();

    for (const name of ['참여자1', '참여자2']) {
      const res = await submitVote(event.id, {
        participantName: name,
        deviceToken: `token-${name}`,
        availableDates: ['2026-12-10'],
      });
      expect(res.success).toBe(true);
    }
    const upd = await submitVote(event.id, {
      participantName: '참여자1',
      deviceToken: 'token-참여자1',
      availableDates: ['2026-12-11'],
    });
    expect(upd.success).toBe(true);
    expect((await getEventById(event.id))?.votes.length).toBe(2);
  });

  it('safely votes when votes table has updatedAt NOT NULL constraint', async () => {
    const db = getDb();
    const event = await createEvent({
      title: 'updatedAt NOT NULL 테스트',
      startDate: '2026-12-10',
      endDate: '2026-12-12',
      password: 'pass',
    });

    // votes 테이블을 updatedAt NOT NULL 제약조건을 가진 형태로 재생성
    await db.execute(`DROP TABLE IF EXISTS votes;`);
    await db.execute(`
      CREATE TABLE votes (
        id TEXT PRIMARY KEY,
        eventId TEXT NOT NULL,
        participantName TEXT NOT NULL,
        pinHash TEXT,
        deviceToken TEXT,
        availableDates TEXT NOT NULL,
        maybeDates TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY(eventId) REFERENCES events(id) ON DELETE CASCADE
      );
    `);

    // initDb 호출
    await initDb();

    // 1. 첫 번째 참여자 등록 시 updatedAt NOT NULL 위반 없이 성공해야 함
    const res1 = await submitVote(event.id, {
      participantName: '참여자1',
      deviceToken: 'dev-token-1',
      availableDates: ['2026-12-10'],
      maybeDates: [],
    });
    expect(res1.success).toBe(true);

    // 2. 두 번째 참여자 등록
    const res2 = await submitVote(event.id, {
      participantName: '참여자2',
      deviceToken: 'dev-token-2',
      availableDates: ['2026-12-11'],
      maybeDates: [],
    });
    expect(res2.success).toBe(true);

    // 3. 참여자 1 투표 수정 시에도 정상 반영
    const resUpdate = await submitVote(event.id, {
      participantName: '참여자1',
      deviceToken: 'dev-token-1',
      availableDates: ['2026-12-10', '2026-12-12'],
      maybeDates: [],
    });
    expect(resUpdate.success).toBe(true);
  });

  describe('Edge Cases & Defensive Behaviors', () => {
    it('rejects voting for a non-existent event', async () => {
      const res = await submitVote('non_existent_id_9999', {
        participantName: '누구세요',
        pin: '1234',
        availableDates: ['2026-11-20'],
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/존재하지 않는/);
    });

    it('rejects voting when neither pin nor deviceToken is provided', async () => {
      const event = await createEvent({
        title: '인증 누락 테스트',
        startDate: '2026-11-20',
        endDate: '2026-11-22',
        password: 'pass',
      });

      const res = await submitVote(event.id, {
        participantName: '철수',
        availableDates: ['2026-11-20'],
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/기기 토큰 또는 비밀번호/);
    });

    it('handles participant names with surrounding whitespace and case sensitivity', async () => {
      const event = await createEvent({
        title: '이름 공백 테스트',
        startDate: '2026-11-20',
        endDate: '2026-11-22',
        password: 'pass',
      });

      // 1. 앞뒤 공백이 포함된 이름으로 등록
      const res1 = await submitVote(event.id, {
        participantName: '   홍길동   ',
        pin: '7777',
        deviceToken: 'device-token-hong',
        availableDates: ['2026-11-20'],
      });
      expect(res1.success).toBe(true);
      expect(res1.vote?.participantName).toBe('홍길동');

      // 2. 공백이 제거된 '홍길동'으로 동일 기기에서 수정 시도 -> 동일인으로 인증 성공해야 함
      const resUpdate = await submitVote(event.id, {
        participantName: '홍길동',
        deviceToken: 'device-token-hong',
        availableDates: ['2026-11-20', '2026-11-21'],
      });
      expect(resUpdate.success).toBe(true);

      const retrieved = await getEventById(event.id);
      expect(retrieved?.votes.length).toBe(1);
      expect(retrieved?.votes[0].participantName).toBe('홍길동');
      expect(retrieved?.votes[0].availableDates).toEqual(['2026-11-20', '2026-11-21']);
    });

    it('safely stores and retrieves names with emojis and special characters', async () => {
      const event = await createEvent({
        title: '이모지 테스트 모임 🎉',
        description: '특수문자: <script>alert(1)</script> & "따옴표"',
        location: '강남역 2번 출구 (스타벅스 ☕)',
        startDate: '2026-11-25',
        endDate: '2026-11-27',
        password: 'pass',
      });

      const emojiName = '🎉김개발(Dev)🍕';
      const voteRes = await submitVote(event.id, {
        participantName: emojiName,
        pin: '1234',
        availableDates: ['2026-11-25'],
        maybeDates: ['2026-11-26'],
      });
      expect(voteRes.success).toBe(true);

      const retrieved = await getEventById(event.id);
      expect(retrieved?.title).toBe('이모지 테스트 모임 🎉');
      expect(retrieved?.location).toBe('강남역 2번 출구 (스타벅스 ☕)');
      expect(retrieved?.votes[0].participantName).toBe(emojiName);
    });

    it('allows participant to vote with zero available dates (cannot attend)', async () => {
      const event = await createEvent({
        title: '불참자 테스트',
        startDate: '2026-11-20',
        endDate: '2026-11-21',
        password: 'pass',
      });

      const res = await submitVote(event.id, {
        participantName: '불참러',
        pin: '0000',
        availableDates: [],
        maybeDates: [],
      });
      expect(res.success).toBe(true);

      const retrieved = await getEventById(event.id);
      expect(retrieved?.votes.length).toBe(1);
      expect(retrieved?.votes[0].participantName).toBe('불참러');
      expect(retrieved?.votes[0].availableDates).toEqual([]);
      expect(retrieved?.votes[0].maybeDates).toEqual([]);
    });

    it('guarantees initDb idempotency when called multiple times consecutively', async () => {
      // 연속으로 여러 번 호출해도 에러 없이 멱등성 유지
      await expect(initDb()).resolves.not.toThrow();
      await expect(initDb()).resolves.not.toThrow();
      await expect(initDb()).resolves.not.toThrow();
    });

    it('preserves inactive room if it has at least one participant even after 14 days', async () => {
      const db = getDb();
      // 1. 20일 전에 생성되었으나 종료일은 아직 안 지난 모임
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
      const oldCreatedAt = twentyDaysAgo.toISOString();

      const event = await createEvent({
        title: '오래되었지만 참여자 있는 방',
        startDate: '2026-12-01',
        endDate: '2026-12-31',
        password: 'pass',
      });

      // 강제로 createdAt을 20일 전으로 수정
      await db.execute({
        sql: `UPDATE events SET createdAt = ? WHERE id = ?`,
        args: [oldCreatedAt, event.id],
      });

      // 2. 참여자 1명 등록
      await submitVote(event.id, {
        participantName: '참여자A',
        pin: '1234',
        availableDates: ['2026-12-01'],
      });

      // 3. 만료 정리 실행 (기준일 2026-11-07)
      await cleanupExpiredEvents('2026-11-07');

      // 참여자가 1명 있으므로 방치된 방으로 간주되지 않고 보존되어야 함!
      const checked = await getEventById(event.id);
      expect(checked).not.toBeNull();
      expect(checked?.title).toBe('오래되었지만 참여자 있는 방');
    });
  });
});
