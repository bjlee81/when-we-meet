import { NextResponse } from 'next/server';
import { initDb, getAllEventsForAdmin, adminForceDeleteEvent, cleanupExpiredEvents } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await initDb();
    // 모임 목록 조회 전 만료된 모임 자동 정리 수행
    await cleanupExpiredEvents();

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

// 만료/방치 모임 일괄 수동 정리 API
export async function PUT(request: Request) {
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

    const result = await cleanupExpiredEvents();
    const events = await getAllEventsForAdmin();
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount, 
      events 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
