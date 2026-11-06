import { describe, it, expect } from 'vitest';
import { calculateHeatmap, findBestDates, ParticipantVote } from '@/lib/scheduler';

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
});
