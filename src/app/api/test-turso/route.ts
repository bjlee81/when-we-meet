import { NextResponse } from 'next/server';
import { getDb, initDb, createEvent, getEventById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logs: string[] = [];
  try {
    logs.push('1. initDb start');
    await initDb();
    logs.push('2. initDb success');

    const testTitle = 'Turso Insert Test ' + Date.now();
    logs.push('3. creating test event: ' + testTitle);
    
    const created = await createEvent({
      title: testTitle,
      description: 'diagnostic test',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      password: 'testpassword123',
    });
    logs.push('4. created event id: ' + created.id);

    logs.push('5. reading back event id: ' + created.id);
    const retrieved = await getEventById(created.id);
    logs.push('6. retrieved event: ' + (retrieved ? 'FOUND (' + retrieved.title + ')' : 'NOT_FOUND'));

    const db = getDb();
    const countRes = await db.execute('SELECT COUNT(*) as count FROM events');
    const totalCount = countRes.rows.length > 0 ? Number(countRes.rows[0].count) : 0;
    logs.push('7. total count in DB: ' + totalCount);

    return NextResponse.json({
      status: 'ok',
      logs,
      createdId: created.id,
      retrieved: Boolean(retrieved),
      totalCount,
    });
  } catch (err: any) {
    logs.push('ERROR: ' + err.message);
    return NextResponse.json({
      status: 'error',
      logs,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack,
    }, { status: 500 });
  }
}
