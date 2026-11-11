import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'When We Meet - 우리 언제 만나',
    short_name: '우리언제만나',
    description: '복잡한 회원가입 없이 링크 공유만으로 모두가 가능한 시간과 장소를 쉽게 맞추는 모임 일정 조율 서비스',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f9ff',
    theme_color: '#4f46e5',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    categories: ['productivity', 'social', 'utilities'],
    lang: 'ko-KR',
    dir: 'ltr',
  };
}
