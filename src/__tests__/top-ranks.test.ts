import { describe, it, expect } from 'vitest';
import { 
  findTopRankedDates, 
  calculateHeatmap, 
  ParticipantVote 
} from '@/lib/scheduler';

describe('Top 3 Ranked Dates Recommendation Engine', () => {
  it('returns sorted top 3 dates with rank, consensus ratio, and unanimous flag', () => {
    const dates = ['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'];
    const votes: ParticipantVote[] = [
      { id: '1', participantName: '철수', availableDates: ['2026-11-20', '2026-11-21', '2026-11-22'], maybeDates: [] },
      { id: '2', participantName: '영희', availableDates: ['2026-11-20', '2026-11-21'], maybeDates: ['2026-11-22'] },
      { id: '3', participantName: '민수', availableDates: ['2026-11-20'], maybeDates: ['2026-11-21'] },
      { id: '4', participantName: '지훈', availableDates: ['2026-11-20'], maybeDates: [] },
    ];

    const heatmap = calculateHeatmap(dates, votes);
    const ranks = findTopRankedDates(heatmap, votes.length, 3);

    expect(ranks).toHaveLength(3);

    // 1st Rank: 2026-11-20 (4/4 all available -> 100% unanimous)
    expect(ranks[0].rank).toBe(1);
    expect(ranks[0].date).toBe('2026-11-20');
    expect(ranks[0].availableCount).toBe(4);
    expect(ranks[0].matchRatio).toBe(100);
    expect(ranks[0].isUnanimous).toBe(true);
    expect(ranks[0].unavailableNames).toEqual([]);

    // 2nd Rank: 2026-11-21 (2 available + 1 maybe -> score 2.5)
    expect(ranks[1].rank).toBe(2);
    expect(ranks[1].date).toBe('2026-11-21');
    expect(ranks[1].isUnanimous).toBe(false);
    expect(ranks[1].unavailableNames).toContain('지훈');

    // 3rd Rank: 2026-11-22 (1 available + 1 maybe -> score 1.5)
    expect(ranks[2].rank).toBe(3);
    expect(ranks[2].date).toBe('2026-11-22');
  });

  it('handles empty votes or empty dates gracefully', () => {
    const ranks = findTopRankedDates({}, 0, 3);
    expect(ranks).toEqual([]);
  });
});
