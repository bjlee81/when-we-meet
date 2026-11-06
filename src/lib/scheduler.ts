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
