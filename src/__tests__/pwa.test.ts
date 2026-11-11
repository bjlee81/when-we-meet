import { describe, it, expect } from 'vitest';
import manifest from '@/app/manifest';

describe('PWA Web App Manifest', () => {
  it('returns valid web app manifest object', () => {
    const data = manifest();
    expect(data.name).toBe('When We Meet - 우리 언제 만나');
    expect(data.short_name).toBe('우리언제만나');
    expect(data.start_url).toBe('/');
    expect(data.display).toBe('standalone');
    expect(data.theme_color).toBe('#4f46e5');
    expect(data.background_color).toBe('#f8f9ff');
  });

  it('contains essential icon definitions including maskable and apple icons', () => {
    const data = manifest();
    expect(Array.isArray(data.icons)).toBe(true);
    expect(data.icons?.length).toBeGreaterThanOrEqual(2);

    const sizes = data.icons?.map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');

    const icon192 = data.icons?.find((icon) => icon.sizes === '192x192');
    expect(icon192?.src).toBe('/icons/icon-192x192.png');
    expect(icon192?.type).toBe('image/png');
  });
});
