import { describe, it, expect } from 'vitest';
import { buildShareMessage } from '@/lib/share';

describe('buildShareMessage', () => {
  const url = 'https://when-we-meet.vercel.app/event/abc123';

  it('builds an invite message when the date is not finalized', () => {
    const msg = buildShareMessage({ title: '송년회' }, url);
    expect(msg.title).toBe('송년회');
    expect(msg.url).toBe(url);
    expect(msg.text).toMatch(/가능한 날짜/);
    expect(msg.text).not.toMatch(/확정/);
  });

  it('builds a confirmation message with the final date and location', () => {
    const msg = buildShareMessage(
      { title: '송년회', finalDate: '2026-12-20', location: '강남역 11번 출구' },
      url
    );
    expect(msg.text).toMatch(/확정/);
    expect(msg.text).toContain('12월 20일');
    expect(msg.text).toContain('강남역 11번 출구');
    expect(msg.url).toBe(url);
  });

  it('omits location line when location is empty or missing', () => {
    const msg = buildShareMessage({ title: 'T', finalDate: '2026-12-20', location: '' }, url);
    expect(msg.text).not.toMatch(/장소/);
  });

  it('treats null/empty finalDate as not finalized', () => {
    expect(buildShareMessage({ title: 'T', finalDate: null }, url).text).not.toMatch(/확정/);
    expect(buildShareMessage({ title: 'T', finalDate: '' }, url).text).not.toMatch(/확정/);
  });

  it('does not throw on an invalid finalDate and falls back to the raw string', () => {
    const msg = buildShareMessage({ title: 'T', finalDate: 'not-a-date' }, url);
    expect(msg.text).toContain('not-a-date');
  });

  it('trims the title and falls back to a default when blank', () => {
    expect(buildShareMessage({ title: '  모임  ' }, url).title).toBe('모임');
    expect(buildShareMessage({ title: '   ' }, url).title).toBe('When We Meet');
  });
});
