import { format, isValid, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface ShareEventInfo {
  title: string;
  finalDate?: string | null;
  location?: string | null;
}

export interface ShareMessage {
  title: string;
  text: string;
  url: string;
}

const DEFAULT_TITLE = 'When We Meet';

function formatFinalDate(dateStr: string): string {
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) return dateStr;
  return format(parsed, 'M월 d일 (EEE)', { locale: ko });
}

/**
 * 공유 시트(navigator.share, 카카오톡 포함)에 전달할 제목/본문/URL을 만듭니다.
 * 확정 여부에 따라 초대 문구 / 확정 안내 문구로 분기합니다.
 */
export function buildShareMessage(event: ShareEventInfo, url: string): ShareMessage {
  const title = event.title.trim() || DEFAULT_TITLE;
  const finalDate = event.finalDate ? event.finalDate.trim() : '';

  if (!finalDate) {
    return {
      title,
      text: `[${title}] 가능한 날짜를 알려주세요! 아래 링크에서 투표해 주세요.`,
      url,
    };
  }

  const lines = [`[${title}] 날짜가 확정되었어요! 📅 ${formatFinalDate(finalDate)}`];
  const location = event.location ? event.location.trim() : '';
  if (location) lines.push(`📍 장소: ${location}`);

  return { title, text: lines.join('\n'), url };
}
