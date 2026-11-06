import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawUrl = process.env.TURSO_DATABASE_URL || '';
    const hasToken = Boolean(process.env.TURSO_AUTH_TOKEN);
    const isUsingTurso = rawUrl.startsWith('libsql://') || rawUrl.startsWith('https://');

    await initDb();
    const db = getDb();
    const testRes = await db.execute('SELECT COUNT(*) as count FROM events');
    const eventCount = testRes.rows.length > 0 ? Number(testRes.rows[0].count) : 0;

    return NextResponse.json({
      status: 'ok',
      dbMode: isUsingTurso ? 'TURSO_CLOUD' : 'LOCAL_SQLITE_FILE',
      tursoUrlConfigured: Boolean(rawUrl),
      tursoUrlPrefix: rawUrl ? rawUrl.substring(0, 15) + '...' : 'none',
      authTokenConfigured: hasToken,
      eventsInCurrentDb: eventCount,
      environment: process.env.NODE_ENV,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
