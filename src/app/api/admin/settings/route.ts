import { NextResponse } from 'next/server';
import { initDb, getSiteSettings, updateSiteSettings } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

export async function GET() {
  try {
    await initDb();
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { password, settings } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '마스터 관리자 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: '설정 데이터가 유효하지 않습니다.' }, { status: 400 });
    }

    const updated = await updateSiteSettings(settings);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
