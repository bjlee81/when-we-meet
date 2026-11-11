// 광고 차단기 우회용 중립 별칭 라우트 (/api/events/[id] 와 동일)
export const dynamic = 'force-dynamic';
export { GET, PATCH, DELETE } from '@/app/api/events/[id]/route';
