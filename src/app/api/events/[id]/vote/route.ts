import { NextResponse } from 'next/server';
import { initDb, submitVote } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const body = await request.json();
    const { participantName, deviceToken, availableDates, maybeDates } = body;

    if (!participantName || !participantName.trim()) {
      return NextResponse.json(
        { error: '이름(닉네임)을 입력해주세요.' },
        { status: 400 }
      );
    }

    const res = await submitVote(id, {
      participantName,
      deviceToken: deviceToken || 'anonymous-device',
      availableDates: availableDates || [],
      maybeDates: maybeDates || [],
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, vote: res.vote });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
