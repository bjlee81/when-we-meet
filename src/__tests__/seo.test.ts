import { describe, it, expect, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { metadata } from '@/app/layout';

describe('SEO & Search Crawler Configurations', () => {
  it('configures robots.txt to allow landing page and disallow admin/api', () => {
    const robotsConfig = robots();

    expect(robotsConfig).toBeDefined();
    expect(robotsConfig.rules).toBeDefined();
    
    // rules가 배열이거나 단일 객체일 수 있음
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
    expect(rules.userAgent).toBe('*');
    expect(rules.allow).toBe('/');
    expect(rules.disallow).toContain('/admin');
    expect(rules.disallow).toContain('/api/');

    expect(robotsConfig.sitemap).toMatch(/sitemap\.xml$/);
  });

  it('generates a valid sitemap.xml with the main landing route', () => {
    const sitemapEntries = sitemap();

    expect(Array.isArray(sitemapEntries)).toBe(true);
    expect(sitemapEntries.length).toBeGreaterThanOrEqual(1);

    const mainEntry = sitemapEntries[0];
    expect(mainEntry.url).toBeDefined();
    expect(mainEntry.changeFrequency).toBe('daily');
    expect(mainEntry.priority).toBe(1.0);
  });

  it('defines rich metadata with keywords and OpenGraph tags in RootLayout', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();

    // 키워드 검증
    const keywords = metadata.keywords;
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords).toEqual(
      expect.arrayContaining(['약속 날짜 조율', '모임 날짜 투표', 'when2meet 한국어'])
    );

    // OpenGraph 검증
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph?.title).toBeDefined();
    expect(metadata.openGraph?.description).toBeDefined();
    expect(metadata.openGraph?.siteName).toBe('When We Meet');

    // Twitter 카드 검증
    expect(metadata.twitter).toBeDefined();
    const twitter = metadata.twitter as { card?: string } | undefined;
    expect(twitter?.card).toBe('summary_large_image');
  });
});
