import { NextResponse } from 'next/server';
import { initDb, createEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * fetch/XHR 이 광고 차단기에 막히는 환경을 위한 폴백.
 * 일반 HTML 폼 제출(페이지 이동)로 모임을 생성하고 303 리다이렉트한다.
 */
export async function POST(request: Request) {
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);
  const fail = (message: string) => redirectTo(`/?error=${encodeURIComponent(message)}`);

  try {
    const form = await request.formData();
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const startDate = String(form.get('startDate') ?? '');
    const endDate = String(form.get('endDate') ?? '');
    const password = String(form.get('password') ?? '');

    if (!title) return fail('모임 제목을 입력해주세요.');
    if (!startDate || !endDate) return fail('시작일과 종료일을 입력해주세요.');
    if (!password) return fail('삭제 관리용 비밀번호를 설정해주세요.');
    if (new Date(startDate) > new Date(endDate)) return fail('종료일은 시작일보다 이후여야 합니다.');

    await initDb();
    const event = await createEvent({ title, description, startDate, endDate, password });
    return redirectTo(`/event/${event.id}`);
  } catch (error) {
    console.error('Failed to create event (form fallback):', error);
    return fail('모임 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}
