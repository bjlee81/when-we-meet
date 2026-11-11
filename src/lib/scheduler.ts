export interface ParticipantVote {
  id: string;
  participantName: string;
  availableDates: string[]; // YYYY-MM-DD or YYYY-MM-DD HH:mm
  maybeDates: string[];     // YYYY-MM-DD or YYYY-MM-DD HH:mm
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

export interface SlotSummary extends DateSummary {
  slot: string;
  tier: number; // 0, 1, 2, 3, 4
}

export type SlotHeatmapData = Record<string, SlotSummary>;

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

/**
 * Stitch 5단계 히트맵 농도 티어(0~4)를 계산합니다.
 * - Tier 0: 0% 참석 (배경색)
 * - Tier 1: 1~25%
 * - Tier 2: 26~50%
 * - Tier 3: 51~75%
 * - Tier 4: 76~100% (만장일치/최고 합의)
 */
export function getSlotDensityTier(availableCount: number, totalParticipants: number): number {
  if (totalParticipants <= 0 || availableCount <= 0) return 0;
  const ratio = availableCount / totalParticipants;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.50) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * 날짜 목록과 시간 범위에 따른 시간대 슬롯 배열을 생성합니다.
 * @param dates 후보 날짜 배열 (예: ['2026-11-20', '2026-11-21'])
 * @param startHour 시작 시간 (기본 12시)
 * @param endHour 종료 시간 (기본 23시)
 * @param stepMinutes 슬롯 간격 (기본 60분)
 */
export function generateTimeSlots(
  dates: string[],
  startHour = 12,
  endHour = 23,
  stepMinutes = 60
): string[] {
  const slots: string[] = [];
  const sortedDates = [...dates].sort();

  for (const date of sortedDates) {
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += stepMinutes) {
        // endHour 정각까지만 포함
        if (h === endHour && m > 0) break;
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        slots.push(`${date} ${hh}:${mm}`);
      }
    }
  }

  return slots;
}

/**
 * 시간대 슬롯 단위 참여자 합의도와 5단계 티어 히트맵 데이터를 집계합니다.
 */
export function calculateSlotHeatmap(
  slots: string[],
  votes: ParticipantVote[]
): SlotHeatmapData {
  const result: SlotHeatmapData = {};
  const totalParticipants = votes.length;

  for (const slot of slots) {
    const availableNames: string[] = [];
    const maybeNames: string[] = [];
    const unavailableNames: string[] = [];

    for (const v of votes) {
      if (v.availableDates.includes(slot)) {
        availableNames.push(v.participantName);
      } else if (v.maybeDates && v.maybeDates.includes(slot)) {
        maybeNames.push(v.participantName);
      } else {
        unavailableNames.push(v.participantName);
      }
    }

    const availableCount = availableNames.length;
    const maybeCount = maybeNames.length;
    const score = availableCount * 1.0 + maybeCount * 0.5;
    const tier = getSlotDensityTier(availableCount, totalParticipants);

    result[slot] = {
      date: slot,
      slot,
      availableCount,
      maybeCount,
      availableNames,
      maybeNames,
      unavailableNames,
      score,
      tier,
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
 */
export function generateWeeklyCalendarGrid(dates: string[]): (string | null)[] {
  if (!dates || dates.length === 0) return [];

  const sortedDates = [...dates].sort();
  const firstDate = new Date(sortedDates[0]);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);

  const getMondayBasedDay = (d: Date) => (d.getDay() + 6) % 7;
  const startDayOfWeek = getMondayBasedDay(firstDate);

  const grid: (string | null)[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    grid.push(null);
  }

  const current = new Date(firstDate);
  while (current <= lastDate) {
    const dateStr = current.toISOString().split('T')[0];
    grid.push(sortedDates.includes(dateStr) ? dateStr : null);
    current.setDate(current.getDate() + 1);
  }

  const remainder = grid.length % 7;
  if (remainder !== 0) {
    const trailingPadding = 7 - remainder;
    for (let i = 0; i < trailingPadding; i++) {
      grid.push(null);
    }
  }

  return grid;
}
