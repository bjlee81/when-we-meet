import { createClient, Client } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { ParticipantVote } from './scheduler';

export interface EventData {
  id: string;
  title: string;
  description: string;
  location?: string;
  startDate: string;
  endDate: string;
  dates: string[];
  passwordHash: string;
  createdAt: string;
  votes: ParticipantVote[];
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  password: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  location?: string;
  password: string;
}

export interface SubmitVoteInput {
  participantName: string;
  pin?: string;
  deviceToken?: string;
  availableDates: string[];
  maybeDates?: string[];
}

let dbClient: Client | null = null;

export function getDb(): Client {
  if (!dbClient) {
    const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;
    dbClient = createClient({
      url,
      authToken,
    });
  }
  return dbClient;
}

// 테스트 및 초기화 용도
export async function setDbClient(client: Client | null) {
  dbClient = client;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      dates TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  try {
    await db.execute(`ALTER TABLE events ADD COLUMN location TEXT;`);
  } catch {}

  await db.execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      participantName TEXT NOT NULL,
      pinHash TEXT,
      deviceToken TEXT,
      availableDates TEXT NOT NULL,
      maybeDates TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(eventId) REFERENCES events(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 기존 테이블 호환성을 위해 컬럼 확인 및 추가 시도
  try {
    await db.execute(`ALTER TABLE votes ADD COLUMN pinHash TEXT;`);
  } catch {}

  try {
    await db.execute(`ALTER TABLE votes ADD COLUMN deviceToken TEXT;`);
  } catch {}
}

function generateDateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const current = new Date(startStr);
  const end = new Date(endStr);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function createEvent(input: CreateEventInput): Promise<EventData> {
  const db = getDb();
  const id = Math.random().toString(36).substring(2, 10);
  const dates = generateDateRange(input.startDate, input.endDate);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO events (id, title, description, location, startDate, endDate, dates, passwordHash, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.title,
      input.description || '',
      input.location || '',
      input.startDate,
      input.endDate,
      JSON.stringify(dates),
      passwordHash,
      createdAt,
    ],
  });

  return {
    id,
    title: input.title,
    description: input.description || '',
    location: input.location || '',
    startDate: input.startDate,
    endDate: input.endDate,
    dates,
    passwordHash,
    createdAt,
    votes: [],
  };
}

export async function getEventById(id: string): Promise<EventData | null> {
  const db = getDb();
  const eventRes = await db.execute({
    sql: `SELECT * FROM events WHERE id = ?`,
    args: [id],
  });

  if (eventRes.rows.length === 0) return null;

  const eventRow = eventRes.rows[0];
  const votesRes = await db.execute({
    sql: `SELECT * FROM votes WHERE eventId = ?`,
    args: [id],
  });

  const votes: ParticipantVote[] = votesRes.rows.map((r) => ({
    id: String(r.id),
    participantName: String(r.participantName),
    availableDates: JSON.parse(String(r.availableDates)),
    maybeDates: JSON.parse(String(r.maybeDates || '[]')),
  }));

  return {
    id: String(eventRow.id),
    title: String(eventRow.title),
    description: String(eventRow.description || ''),
    location: eventRow.location ? String(eventRow.location) : '',
    startDate: String(eventRow.startDate),
    endDate: String(eventRow.endDate),
    dates: JSON.parse(String(eventRow.dates)),
    passwordHash: String(eventRow.passwordHash),
    createdAt: String(eventRow.createdAt),
    votes,
  };
}

export async function submitVote(
  eventId: string,
  input: SubmitVoteInput
): Promise<{ success: boolean; vote?: ParticipantVote; error?: string }> {
  const db = getDb();
  const trimmedName = input.participantName.trim();
  const pin = input.pin ? input.pin.trim() : '';
  const deviceToken = input.deviceToken ? input.deviceToken.trim() : '';

  if (!pin && !deviceToken) {
    return { success: false, error: '본인 인증을 위한 기기 토큰 또는 비밀번호(PIN)가 필요합니다.' };
  }

  const existingRes = await db.execute({
    sql: `SELECT id, pinHash, deviceToken FROM votes WHERE eventId = ? AND participantName = ?`,
    args: [eventId, trimmedName],
  });

  const availableDatesJson = JSON.stringify(input.availableDates);
  const maybeDatesJson = JSON.stringify(input.maybeDates || []);
  const now = new Date().toISOString();

  if (existingRes.rows.length > 0) {
    const existingRow = existingRes.rows[0];
    const storedPinHash = existingRow.pinHash ? String(existingRow.pinHash) : null;
    const storedDeviceToken = existingRow.deviceToken ? String(existingRow.deviceToken) : null;

    // 인증 검증:
    // 1) 등록된 브라우저/기기 토큰과 일치하면 즉시 통과!
    let authenticated = false;
    if (storedDeviceToken && deviceToken && storedDeviceToken === deviceToken) {
      authenticated = true;
    } else if (storedPinHash && pin) {
      // 2) 기기가 다르더라도 PIN이 일치하면 통과
      const isMatch = await bcrypt.compare(pin, storedPinHash);
      if (isMatch) authenticated = true;
    }

    if (!authenticated) {
      return {
        success: false,
        error: '이미 등록된 이름입니다. 최초 등록한 브라우저(기기)가 아니거나 비밀번호(PIN)가 일치하지 않습니다.',
      };
    }

    const voteId = String(existingRow.id);
    await db.execute({
      sql: `UPDATE votes SET availableDates = ?, maybeDates = ?, createdAt = ? WHERE id = ?`,
      args: [availableDatesJson, maybeDatesJson, now, voteId],
    });

    return {
      success: true,
      vote: {
        id: voteId,
        participantName: trimmedName,
        availableDates: input.availableDates,
        maybeDates: input.maybeDates || [],
      },
    };
  }

  // 신규 등록
  const voteId = Math.random().toString(36).substring(2, 10);
  const pinHash = pin ? await bcrypt.hash(pin, 10) : null;

  await db.execute({
    sql: `INSERT INTO votes (id, eventId, participantName, pinHash, deviceToken, availableDates, maybeDates, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      voteId,
      eventId,
      trimmedName,
      pinHash,
      deviceToken || null,
      availableDatesJson,
      maybeDatesJson,
      now,
    ],
  });

  return {
    success: true,
    vote: {
      id: voteId,
      participantName: trimmedName,
      availableDates: input.availableDates,
      maybeDates: input.maybeDates || [],
    },
  };
}

export async function updateEventDetails(
  eventId: string,
  input: UpdateEventInput
): Promise<{ success: boolean; event?: EventData; error?: string }> {
  const db = getDb();
  const eventRes = await db.execute({
    sql: `SELECT passwordHash FROM events WHERE id = ?`,
    args: [eventId],
  });

  if (eventRes.rows.length === 0) {
    return { success: false, error: '존재하지 않는 일정입니다.' };
  }

  const hash = String(eventRes.rows[0].passwordHash);
  const isMatch = await bcrypt.compare(input.password, hash);

  if (!isMatch) {
    return { success: false, error: '방장 비밀번호가 일치하지 않습니다.' };
  }

  // 업데이트 실행
  if (input.title !== undefined) {
    await db.execute({
      sql: `UPDATE events SET title = ? WHERE id = ?`,
      args: [input.title, eventId],
    });
  }
  if (input.description !== undefined) {
    await db.execute({
      sql: `UPDATE events SET description = ? WHERE id = ?`,
      args: [input.description, eventId],
    });
  }
  if (input.location !== undefined) {
    await db.execute({
      sql: `UPDATE events SET location = ? WHERE id = ?`,
      args: [input.location, eventId],
    });
  }

  const updated = await getEventById(eventId);
  return { success: true, event: updated || undefined };
}

export async function deleteEventWithPassword(
  eventId: string,
  passwordAttempt: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  const eventRes = await db.execute({
    sql: `SELECT passwordHash FROM events WHERE id = ?`,
    args: [eventId],
  });

  if (eventRes.rows.length === 0) {
    return { success: false, error: '존재하지 않는 일정입니다.' };
  }

  const hash = String(eventRes.rows[0].passwordHash);
  const isMatch = await bcrypt.compare(passwordAttempt, hash);

  if (!isMatch) {
    return { success: false, error: '비밀번호가 일치하지 않습니다.' };
  }

  await db.execute({
    sql: `DELETE FROM votes WHERE eventId = ?`,
    args: [eventId],
  });

  await db.execute({
    sql: `DELETE FROM events WHERE id = ?`,
    args: [eventId],
  });

  return { success: true };
}

// ================= 전체 관리자(Admin) 전용 기능 =================

export async function getAllEventsForAdmin(): Promise<any[]> {
  const db = getDb();
  const eventsRes = await db.execute(`
    SELECT e.*, COUNT(v.id) as participantCount 
    FROM events e 
    LEFT JOIN votes v ON e.id = v.eventId 
    GROUP BY e.id 
    ORDER BY e.createdAt DESC
  `);

  return eventsRes.rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    description: String(r.description || ''),
    location: String(r.location || ''),
    startDate: String(r.startDate),
    endDate: String(r.endDate),
    createdAt: String(r.createdAt),
    participantCount: Number(r.participantCount || 0),
  }));
}

export async function adminForceDeleteEvent(eventId: string): Promise<boolean> {
  const db = getDb();
  await db.execute({ sql: `DELETE FROM votes WHERE eventId = ?`, args: [eventId] });
  await db.execute({ sql: `DELETE FROM events WHERE id = ?`, args: [eventId] });
  return true;
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  const db = getDb();
  const res = await db.execute(`SELECT * FROM settings`);
  const settings: Record<string, string> = {
    ad_enabled: 'false',
    ad_google_client_id: '',
    ad_google_slot_id: '',
    ad_kakao_unit_id: '',
    ad_custom_html: '',
  };
  for (const row of res.rows) {
    settings[String(row.key)] = String(row.value);
  }
  return settings;
}

export async function updateSiteSettings(
  newSettings: Record<string, string>
): Promise<Record<string, string>> {
  const db = getDb();
  for (const [key, val] of Object.entries(newSettings)) {
    await db.execute({
      sql: `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?`,
      args: [key, String(val), String(val)],
    });
  }
  return getSiteSettings();
}
