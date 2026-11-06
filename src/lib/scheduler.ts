export interface ParticipantVote {
  id: string;
  participantName: string;
  availableDates: string[]; // YYYY-MM-DD
  maybeDates: string[];     // YYYY-MM-DD
}

export interface DateSummary {
  date: string;
  availableCount: number;
  maybeCount: number;
  availableNames: string[];
  maybeNames: string[];
  unavailableNames: string[];
  score: number; // availableCount * 1.0 + maybeCount * 0.5
}

export type HeatmapData = Record<string, DateSummary>;

export function calculateHeatmap(
  targetDates: string[],
  votes: ParticipantVote[]
): HeatmapData {
  const result: HeatmapData = {};

  for (const d of targetDates) {
    const availableNames: string[] = [];
    const maybeNames: string[] = [];
    const unavailableNames: string[] = [];

    for (const v of votes) {
      if (v.availableDates.includes(d)) {
        availableNames.push(v.participantName);
      } else if (v.maybeDates && v.maybeDates.includes(d)) {
        maybeNames.push(v.participantName);
      } else {
        unavailableNames.push(v.participantName);
      }
    }

    const availableCount = availableNames.length;
    const maybeCount = maybeNames.length;
    const score = availableCount * 1.0 + maybeCount * 0.5;

    result[d] = {
      date: d,
      availableCount,
      maybeCount,
      availableNames,
      maybeNames,
      unavailableNames,
      score,
    };
  }

  return result;
}

export function findBestDates(heatmap: HeatmapData): DateSummary[] {
  const summaries = Object.values(heatmap);
  if (summaries.length === 0) return [];

  const maxScore = Math.max(...summaries.map((s) => s.score));
  if (maxScore <= 0) return [];

  return summaries
    .filter((s) => s.score === maxScore)
    .sort((a, b) => b.availableCount - a.availableCount);
}

/**
 * 날짜 목록을 받아 월요일(Mon)부터 일요일(Sun)까지의 7열 주간 그리드 배열을 반환합니다.
 * 월요일 = 0, 화요일 = 1, ... 일요일 = 6
 * 빈 칸은 null로 패딩됩니다.
 */
export function generateWeeklyCalendarGrid(dates: string[]): (string | null)[] {
  if (!dates || dates.length === 0) return [];

  const sortedDates = [...dates].sort();
  const firstDate = new Date(sortedDates[0]);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);

  // JS getDay(): 0(Sun), 1(Mon), ..., 6(Sat)
  // 월요일 시작 인덱스로 변환: Mon(0), Tue(1), ..., Sun(6)
  const getMondayBasedDay = (d: Date) => (d.getDay() + 6) % 7;

  const startDayOfWeek = getMondayBasedDay(firstDate);
  const endDayOfWeek = getMondayBasedDay(lastDate);

  const grid: (string | null)[] = [];

  // 1. 첫째 주 시작 전 빈 칸 패딩
  for (let i = 0; i < startDayOfWeek; i++) {
    grid.push(null);
  }

  // 2. 시작일부터 종료일까지 날짜 채우기
  const current = new Date(firstDate);
  while (current <= lastDate) {
    const dateStr = current.toISOString().split('T')[0];
    grid.push(sortedDates.includes(dateStr) ? dateStr : null);
    current.setDate(current.getDate() + 1);
  }

  // 3. 마지막 주 종료 후 빈 칸 패딩 (7의 배수 맞춤)
  const remainder = grid.length % 7;
  if (remainder !== 0) {
    const trailingPadding = 7 - remainder;
    for (let i = 0; i < trailingPadding; i++) {
      grid.push(null);
    }
  }

  return grid;
}
