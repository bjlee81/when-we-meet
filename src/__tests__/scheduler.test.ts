import { describe, it, expect } from 'vitest';
import { 
  calculateHeatmap, 
  findBestDates, 
  ParticipantVote, 
  generateWeeklyCalendarGrid 
} from '@/lib/scheduler';

describe('Scheduler Logic', () => {
  const dates = ['2026-11-10', '2026-11-11', '2026-11-12'];

  const votes: ParticipantVote[] = [
    {
      id: '1',
      participantName: 'Alice',
      availableDates: ['2026-11-10', '2026-11-11'],
      maybeDates: [],
    },
    {
      id: '2',
      participantName: 'Bob',
      availableDates: ['2026-11-11', '2026-11-12'],
      maybeDates: [],
    },
    {
      id: '3',
      participantName: 'Charlie',
      availableDates: ['2026-11-11'],
      maybeDates: ['2026-11-10'],
    },
  ];

  it('calculates correct heatmap counts for given dates', () => {
    const heatmap = calculateHeatmap(dates, votes);
    
    // 2026-11-10: Alice(avail=1), Bob(0), Charlie(maybe=0.5 or maybeCount=1)
    expect(heatmap['2026-11-10'].availableCount).toBe(1);
    expect(heatmap['2026-11-10'].maybeCount).toBe(1);
    expect(heatmap['2026-11-10'].availableNames).toEqual(['Alice']);

    // 2026-11-11: Alice, Bob, Charlie all available
    expect(heatmap['2026-11-11'].availableCount).toBe(3);
    expect(heatmap['2026-11-11'].availableNames).toEqual(['Alice', 'Bob', 'Charlie']);

    // 2026-11-12: Bob available
    expect(heatmap['2026-11-12'].availableCount).toBe(1);
    expect(heatmap['2026-11-12'].availableNames).toEqual(['Bob']);
  });

  it('identifies the best dates with the highest attendance', () => {
    const heatmap = calculateHeatmap(dates, votes);
    const best = findBestDates(heatmap);

    expect(best.length).toBe(1);
    expect(best[0].date).toBe('2026-11-11');
    expect(best[0].score).toBe(3);
  });

  it('generates weekly calendar grid starting on Monday with proper padding', () => {
    // 2026-11-11 is Wednesday (day index 2 in Monday-based index 0..6)
    // 2026-11-15 is Sunday (day index 6)
    const testDates = ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'];
    const grid = generateWeeklyCalendarGrid(testDates);

    // Each week should have 7 slots
    expect(grid.length % 7).toBe(0);
    // 2026-11-11 is Wed, so Mon(0) and Tue(1) should be null (padded)
    expect(grid[0]).toBeNull(); // Monday
    expect(grid[1]).toBeNull(); // Tuesday
    expect(grid[2]).toBe('2026-11-11'); // Wednesday
    expect(grid[3]).toBe('2026-11-12'); // Thursday
    expect(grid[4]).toBe('2026-11-13'); // Friday
    expect(grid[5]).toBe('2026-11-14'); // Saturday
    expect(grid[6]).toBe('2026-11-15'); // Sunday
  });

  describe('Edge Cases', () => {
    it('returns empty array from findBestDates when all scores are 0', () => {
      const zeroVotes: ParticipantVote[] = [
        {
          id: 'v1',
          participantName: '바쁜사람',
          availableDates: [],
          maybeDates: [],
        },
      ];
      const heatmap = calculateHeatmap(dates, zeroVotes);
      const best = findBestDates(heatmap);
      expect(best).toEqual([]);
      expect(heatmap['2026-11-10'].unavailableNames).toEqual(['바쁜사람']);
    });

    it('prioritizes higher availableCount when scores are tied', () => {
      // 2026-11-10: 2 available = score 2.0
      // 2026-11-11: 1 available + 2 maybe = score 1.0 + 1.0 = 2.0
      const tieVotes: ParticipantVote[] = [
        {
          id: '1',
          participantName: 'UserA',
          availableDates: ['2026-11-10', '2026-11-11'],
          maybeDates: [],
        },
        {
          id: '2',
          participantName: 'UserB',
          availableDates: ['2026-11-10'],
          maybeDates: ['2026-11-11'],
        },
        {
          id: '3',
          participantName: 'UserC',
          availableDates: [],
          maybeDates: ['2026-11-11'],
        },
      ];

      const heatmap = calculateHeatmap(['2026-11-10', '2026-11-11'], tieVotes);
      expect(heatmap['2026-11-10'].score).toBe(2);
      expect(heatmap['2026-11-11'].score).toBe(2);

      const best = findBestDates(heatmap);
      expect(best.length).toBe(2);
      // availableCount가 2인 2026-11-10이 1순위여야 함
      expect(best[0].date).toBe('2026-11-10');
      expect(best[0].availableCount).toBe(2);
      expect(best[1].date).toBe('2026-11-11');
      expect(best[1].availableCount).toBe(1);
    });

    it('safely handles empty votes array without runtime exceptions', () => {
      const heatmap = calculateHeatmap(dates, []);
      expect(Object.keys(heatmap)).toEqual(dates);
      for (const d of dates) {
        expect(heatmap[d].availableCount).toBe(0);
        expect(heatmap[d].maybeCount).toBe(0);
        expect(heatmap[d].score).toBe(0);
        expect(heatmap[d].availableNames).toEqual([]);
        expect(heatmap[d].unavailableNames).toEqual([]);
      }
      expect(findBestDates(heatmap)).toEqual([]);
    });

    it('handles duplicate dates in single user vote without inflating participant count', () => {
      const duplicateVote: ParticipantVote[] = [
        {
          id: 'v1',
          participantName: '중복선택자',
          availableDates: ['2026-11-10', '2026-11-10'],
          maybeDates: ['2026-11-10'],
        },
      ];
      const heatmap = calculateHeatmap(['2026-11-10'], duplicateVote);
      expect(heatmap['2026-11-10'].availableCount).toBe(1);
      expect(heatmap['2026-11-10'].availableNames).toEqual(['중복선택자']);
      expect(heatmap['2026-11-10'].score).toBe(1);
    });

    it('handles empty dates array in generateWeeklyCalendarGrid', () => {
      expect(generateWeeklyCalendarGrid([])).toEqual([]);
    });
  });
});
