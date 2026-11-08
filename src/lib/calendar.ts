import { addDays, format, parseISO } from 'date-fns';

export interface CalendarEventInfo {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string | null;
  location?: string | null;
  eventUrl?: string | null;
}

/**
 * YYYY-MM-DD 형식의 날짜로부터 YYYYMMDD 시작일과 다음날 YYYYMMDD 종료일(종일 일정용)을 계산합니다.
 */
function getStartAndEndDates(dateStr: string): { start: string; end: string } {
  const parsed = parseISO(dateStr);
  const nextDay = addDays(parsed, 1);
  return {
    start: format(parsed, 'yyyyMMdd'),
    end: format(nextDay, 'yyyyMMdd'),
  };
}

/**
 * Google Calendar 일정 등록 URL 생성
 */
export function generateGoogleCalendarUrl(event: CalendarEventInfo): string {
  const { start, end } = getStartAndEndDates(event.date);

  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', event.title || 'When We Meet 모임');
  params.set('dates', `${start}/${end}`);

  const detailsParts: string[] = [];
  if (event.description) detailsParts.push(event.description);
  if (event.eventUrl) detailsParts.push(`\n모임 조율 링크: ${event.eventUrl}`);

  if (detailsParts.length > 0) {
    params.set('details', detailsParts.join('\n'));
  }

  if (event.location && event.location.trim()) {
    params.set('location', event.location.trim());
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * iCalendar (.ics) 필드용 특수문자 이스케이프
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Apple Calendar / Outlook / 기본 캘린더용 RFC 5545 .ics 파일 내용 생성
 */
export function generateIcsContent(event: CalendarEventInfo): string {
  const { start, end } = getStartAndEndDates(event.date);
  const nowStr = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  const uid = `wwm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@when-we-meet`;

  const descriptionParts: string[] = [];
  if (event.description) descriptionParts.push(event.description);
  if (event.eventUrl) descriptionParts.push(`모임 링크: ${event.eventUrl}`);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WhenWeMeet//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(event.title || 'When We Meet 모임')}`,
  ];

  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeIcsText(descriptionParts.join('\n'))}`);
  }

  if (event.location && event.location.trim()) {
    lines.push(`LOCATION:${escapeIcsText(event.location.trim())}`);
  }

  if (event.eventUrl) {
    lines.push(`URL:${event.eventUrl}`);
  }

  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * 브라우저 환경에서 .ics 파일을 다운로드 트리거하는 헬퍼 함수
 */
export function downloadIcsFile(event: CalendarEventInfo): void {
  if (typeof window === 'undefined') return;

  const content = generateIcsContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const filename = `${(event.title || '약속일정').replace(/[^\w\s가-힣-]/g, '').trim() || 'event'}.ics`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
