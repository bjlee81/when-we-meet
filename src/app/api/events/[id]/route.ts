import { NextResponse } from 'next/server';
import { initDb, getEventById, deleteEventWithPassword } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 보안상 passwordHash는 제외하고 반환
    const { passwordHash, ...safeEvent } = event;
    return NextResponse.json({ event: safeEvent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: '삭제 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const res = await deleteEventWithPassword(id, password);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: '모임 일정이 삭제되었습니다.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
