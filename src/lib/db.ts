import { createClient, Client } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { ParticipantVote } from './scheduler';

export interface EventData {
  id: string;
  title: string;
  description: string;
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
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  password: string;
}

export interface SubmitVoteInput {
  participantName: string;
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
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      dates TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      participantName TEXT NOT NULL,
      availableDates TEXT NOT NULL,
      maybeDates TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(eventId) REFERENCES events(id) ON DELETE CASCADE
    );
  `);
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
    sql: `INSERT INTO events (id, title, description, startDate, endDate, dates, passwordHash, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.title,
      input.description || '',
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
): Promise<ParticipantVote> {
  const db = getDb();
  const existing = await db.execute({
    sql: `SELECT id FROM votes WHERE eventId = ? AND participantName = ?`,
    args: [eventId, input.participantName.trim()],
  });

  const voteId = existing.rows.length > 0 
    ? String(existing.rows[0].id) 
    : Math.random().toString(36).substring(2, 10);

  const availableDatesJson = JSON.stringify(input.availableDates);
  const maybeDatesJson = JSON.stringify(input.maybeDates || []);
  const now = new Date().toISOString();

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `UPDATE votes SET availableDates = ?, maybeDates = ?, createdAt = ? WHERE id = ?`,
      args: [availableDatesJson, maybeDatesJson, now, voteId],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO votes (id, eventId, participantName, availableDates, maybeDates, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        voteId,
        eventId,
        input.participantName.trim(),
        availableDatesJson,
        maybeDatesJson,
        now,
      ],
    });
  }

  return {
    id: voteId,
    participantName: input.participantName.trim(),
    availableDates: input.availableDates,
    maybeDates: input.maybeDates || [],
  };
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
