import { describe, it, expect } from 'vitest';
import { generateGoogleCalendarUrl, generateIcsContent } from '@/lib/calendar';

describe('Calendar Export Utilities', () => {
  const sampleEvent = {
    title: '연말 송년회 🎉',
    description: '강남역에서 만나요!',
    location: '강남역 11번 출구 맛집',
    date: '2026-12-25',
    eventUrl: 'https://when-we-meet-gamma.vercel.app/event/abc12345',
  };

  describe('generateGoogleCalendarUrl', () => {
    it('generates a valid Google Calendar template URL for an all-day event', () => {
      const urlString = generateGoogleCalendarUrl(sampleEvent);
      expect(urlString.startsWith('https://calendar.google.com/calendar/render?')).toBe(true);

      const url = new URL(urlString);
      expect(url.searchParams.get('action')).toBe('TEMPLATE');
      expect(url.searchParams.get('text')).toBe('연말 송년회 🎉');
      expect(url.searchParams.get('dates')).toBe('20261225/20261226');
      expect(url.searchParams.get('location')).toBe('강남역 11번 출구 맛집');
      expect(url.searchParams.get('details')).toContain('강남역에서 만나요!');
      expect(url.searchParams.get('details')).toContain(sampleEvent.eventUrl);
    });

    it('handles missing location and description gracefully', () => {
      const minimal = {
        title: '단순 모임',
        date: '2026-11-15',
      };
      const url = new URL(generateGoogleCalendarUrl(minimal));
      expect(url.searchParams.get('dates')).toBe('20261115/20261116');
      expect(url.searchParams.has('location')).toBe(false);
      expect(url.searchParams.has('details')).toBe(false);
    });
  });

  describe('generateIcsContent', () => {
    it('generates a standard RFC 5545 iCalendar format', () => {
      const ics = generateIcsContent(sampleEvent);
      
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('DTSTART;VALUE=DATE:20261225');
      expect(ics).toContain('DTEND;VALUE=DATE:20261226');
      expect(ics).toContain('SUMMARY:연말 송년회 🎉');
      expect(ics).toContain('LOCATION:강남역 11번 출구 맛집');
      expect(ics).toContain(sampleEvent.eventUrl);
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('escapes special characters like commas and semicolons in description', () => {
      const eventWithSpecialChars = {
        title: '회의, 미팅; 체크',
        description: '첫번째 줄\n두번째 줄, 쉼표; 세미콜론',
        location: '서울, 강남구',
        date: '2026-11-20',
      };
      const ics = generateIcsContent(eventWithSpecialChars);
      expect(ics).toContain('DTSTART;VALUE=DATE:20261120');
      expect(ics).toContain('DTEND;VALUE=DATE:20261121');
      // 줄바꿈은 \n으로 이스케이프
      expect(ics).toContain('\\n');
    });
  });
});
