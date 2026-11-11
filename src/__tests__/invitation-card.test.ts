import { describe, it, expect } from 'vitest';
import { formatInvitationCardDetails, InvitationCardData } from '@/lib/invitation-card';

describe('Invitation Card Formatter & Generator', () => {
  it('formats event details cleanly for canvas card rendering', () => {
    const data: InvitationCardData = {
      title: '연말 송년회 파티 🎉',
      finalDate: '2026-12-25',
      location: '강남역 와인바',
      participants: ['민수', '지원', '준호', '수빈'],
    };

    const details = formatInvitationCardDetails(data);
    expect(details.formattedDate).toMatch(/2026년 12월 25일/);
    expect(details.formattedDate).toMatch(/금요일/);
    expect(details.participantSummary).toBe('민수, 지원, 준호, 수빈 (총 4명)');
    expect(details.locationText).toBe('강남역 와인바');
  });

  it('handles optional location and empty participants', () => {
    const data: InvitationCardData = {
      title: '가벼운 티타임',
      finalDate: '2026-11-20',
      participants: [],
    };

    const details = formatInvitationCardDetails(data);
    expect(details.locationText).toBe('장소 미정 (추후 공지)');
    expect(details.participantSummary).toBe('참석 확정자 확인 중');
  });
});
