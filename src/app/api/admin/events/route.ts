import { NextResponse } from 'next/server';
import { initDb, getAllEventsForAdmin, adminForceDeleteEvent } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { password } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '마스터 관리자 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    const events = await getAllEventsForAdmin();
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { password, eventId } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '마스터 관리자 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    if (!eventId) {
      return NextResponse.json({ error: '삭제할 모임 ID가 필요합니다.' }, { status: 400 });
    }

    await adminForceDeleteEvent(eventId);
    return NextResponse.json({ success: true, message: '모임이 관리자 권한으로 삭제되었습니다.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
