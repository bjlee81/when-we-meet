import { describe, it, expect } from 'vitest';
import { 
  generateTimeSlots, 
  getSlotDensityTier, 
  calculateSlotHeatmap,
  ParticipantVote 
} from '@/lib/scheduler';

describe('Time Poll Scheduler & Slot Engine', () => {
  it('generates continuous 1-hour time slots across candidate dates', () => {
    const dates = ['2026-11-20', '2026-11-21'];
    // 18:00 to 21:00 (hourly: 18:00, 19:00, 20:00, 21:00)
    const slots = generateTimeSlots(dates, 18, 21, 60);

    expect(slots).toHaveLength(8); // 4 slots * 2 days
    expect(slots[0]).toBe('2026-11-20 18:00');
    expect(slots[1]).toBe('2026-11-20 19:00');
    expect(slots[3]).toBe('2026-11-20 21:00');
    expect(slots[4]).toBe('2026-11-21 18:00');
  });

  it('determines correct heatmap density tier (0 to 4) based on consensus ratio', () => {
    // 0 out of 5 -> tier 0
    expect(getSlotDensityTier(0, 5)).toBe(0);
    // 1 out of 5 (20%) -> tier 1
    expect(getSlotDensityTier(1, 5)).toBe(1);
    // 2 out of 5 (40%) -> tier 2
    expect(getSlotDensityTier(2, 5)).toBe(2);
    // 3 out of 5 (60%) -> tier 3
    expect(getSlotDensityTier(3, 5)).toBe(3);
    // 4 out of 5 (80%) -> tier 4
    expect(getSlotDensityTier(4, 5)).toBe(4);
    // 5 out of 5 (100%) -> tier 4
    expect(getSlotDensityTier(5, 5)).toBe(4);
    // Total 0 participants
    expect(getSlotDensityTier(0, 0)).toBe(0);
  });

  it('calculates slot-level consensus with preferred/maybe weighted scores', () => {
    const slots = ['2026-11-20 18:00', '2026-11-20 19:00'];
    const votes: ParticipantVote[] = [
      {
        id: '1',
        participantName: '민수',
        availableDates: ['2026-11-20 18:00', '2026-11-20 19:00'],
        maybeDates: [],
      },
      {
        id: '2',
        participantName: '지원',
        availableDates: ['2026-11-20 18:00'],
        maybeDates: ['2026-11-20 19:00'],
      },
      {
        id: '3',
        participantName: '준호',
        availableDates: [],
        maybeDates: [],
      },
    ];

    const result = calculateSlotHeatmap(slots, votes);

    expect(result['2026-11-20 18:00'].availableCount).toBe(2);
    expect(result['2026-11-20 18:00'].availableNames).toEqual(['민수', '지원']);
    expect(result['2026-11-20 18:00'].tier).toBe(3); // 2/3 = 66% -> Tier 3

    expect(result['2026-11-20 19:00'].availableCount).toBe(1);
    expect(result['2026-11-20 19:00'].maybeCount).toBe(1);
    expect(result['2026-11-20 19:00'].score).toBe(1.5); // 1.0 + 0.5
  });
});
