import { NextResponse } from 'next/server';
import { initDb, getAllFeedbacksForAdmin, adminDeleteFeedback } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

export const dynamic = 'force-dynamic';

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

    const feedbacks = await getAllFeedbacksForAdmin();
    return NextResponse.json({ success: true, feedbacks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { password, feedbackId } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '마스터 관리자 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    if (!feedbackId) {
      return NextResponse.json({ error: '삭제할 피드백 ID가 필요합니다.' }, { status: 400 });
    }

    await adminDeleteFeedback(feedbackId);
    return NextResponse.json({ success: true, message: '피드백이 삭제되었습니다.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
