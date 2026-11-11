import { format, parseISO, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface InvitationCardData {
  title: string;
  finalDate: string;
  location?: string | null;
  participants: string[];
}

export interface FormattedInvitationCard {
  title: string;
  formattedDate: string;
  locationText: string;
  participantSummary: string;
}

/**
 * 모임 확정 카드 텍스트 레이아웃 포맷팅
 */
export function formatInvitationCardDetails(data: InvitationCardData): FormattedInvitationCard {
  let formattedDate = data.finalDate;
  const parsed = parseISO(data.finalDate);
  if (isValid(parsed)) {
    formattedDate = format(parsed, 'yyyy년 M월 d일 (EEEE)', { locale: ko });
  }

  const locationText = data.location?.trim() || '장소 미정 (추후 공지)';

  const pList = data.participants.filter(Boolean);
  const participantSummary =
    pList.length > 0
      ? `${pList.slice(0, 6).join(', ')}${pList.length > 6 ? ` 외 ${pList.length - 6}명` : ''} (총 ${pList.length}명)`
      : '참석 확정자 확인 중';

  return {
    title: data.title.trim() || '우리들의 약속',
    formattedDate,
    locationText,
    participantSummary,
  };
}

/**
 * 브라우저 환경에서 Canvas를 통해 고화질(1080x1350) SNS 공유용 확정 안내장 이미지를 렌더링하고 다운로드합니다.
 */
export async function downloadInvitationCardImage(data: InvitationCardData): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const { title, formattedDate, locationText, participantSummary } = formatInvitationCardDetails(data);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // 1. 배경 그라디언트
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
  bgGrad.addColorStop(0, '#0b1c30');
  bgGrad.addColorStop(0.5, '#1e1b4b');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1350);

  // 2. 앰비언트 블러 원형 장식
  const glowGrad1 = ctx.createRadialGradient(200, 200, 10, 200, 200, 500);
  glowGrad1.addColorStop(0, 'rgba(79, 70, 229, 0.45)');
  glowGrad1.addColorStop(1, 'rgba(79, 70, 229, 0)');
  ctx.fillStyle = glowGrad1;
  ctx.fillRect(0, 0, 1080, 1350);

  const glowGrad2 = ctx.createRadialGradient(880, 1000, 10, 880, 1000, 500);
  glowGrad2.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  glowGrad2.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = glowGrad2;
  ctx.fillRect(0, 0, 1080, 1350);

  // 3. 내부 반투명 카드 프레임
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  roundRect(ctx, 80, 100, 920, 1150, 48);
  ctx.fill();
  ctx.stroke();

  // 4. 상단 배지
  ctx.fillStyle = '#4f46e5';
  roundRect(ctx, 140, 170, 360, 64, 32);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 모임 날짜 최종 확정!', 320, 212);

  // 5. 모임 제목
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 56px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  wrapText(ctx, title, 140, 320, 800, 72);

  // 6. 구분선
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(140, 450);
  ctx.lineTo(940, 450);
  ctx.stroke();

  // 7. 확정 일시 섹션
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('📅 확정 일시', 140, 530);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 48px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText(formattedDate, 140, 600);

  // 8. 모임 장소 섹션
  ctx.fillStyle = '#f43f5e';
  ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('📍 모임 장소', 140, 710);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 38px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  wrapText(ctx, locationText, 140, 770, 800, 52);

  // 9. 참석자 명단 섹션
  ctx.fillStyle = '#34d399';
  ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('👥 참석 확정 친구들', 140, 890);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 32px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  wrapText(ctx, participantSummary, 140, 950, 800, 48);

  // 10. 하단 브랜딩
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('초간편 약속 조율 • When We Meet (우리 언제 만나)', 540, 1190);

  // 다운로드 트리거
  const link = document.createElement('a');
  link.download = `약속확정_${title.replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  return true;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}
