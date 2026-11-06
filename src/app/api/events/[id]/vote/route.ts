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
    const { participantName, availableDates, maybeDates } = body;

    if (!participantName || !participantName.trim()) {
      return NextResponse.json(
        { error: '이름(닉네임)을 입력해주세요.' },
        { status: 400 }
      );
    }

    const vote = await submitVote(id, {
      participantName,
      availableDates: availableDates || [],
      maybeDates: maybeDates || [],
    });

    return NextResponse.json({ success: true, vote });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
