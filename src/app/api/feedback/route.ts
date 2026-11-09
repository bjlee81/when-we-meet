import { NextResponse } from 'next/server';
import { initDb, createFeedback } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { category, content, contact } = body;

    const res = await createFeedback({
      category,
      content,
      contact,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, feedback: res.feedback });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
