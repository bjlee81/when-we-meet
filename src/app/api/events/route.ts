import { NextResponse } from 'next/server';
import { initDb, createEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { title, description, startDate, endDate, password } = body;

    if (!title || !startDate || !endDate || !password) {
      return NextResponse.json(
        { error: '필수 항목(제목, 시작일, 종료일, 비밀번호)을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: '종료일은 시작일보다 빠를 수 없습니다.' },
        { status: 400 }
      );
    }

    const event = await createEvent({
      title,
      description,
      startDate,
      endDate,
      password,
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        dates: event.dates,
      },
    });
  } catch (error: any) {
    console.error('Failed to create event:', error);
    return NextResponse.json(
      { error: error?.message || '모임 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
