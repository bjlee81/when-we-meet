'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AdBannerProps {
  slotId?: string;
  className?: string;
  format?: 'horizontal' | 'rectangle';
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId = 'sample-slot',
  className = '',
  format = 'horizontal',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adConfig, setAdConfig] = useState<{
    ad_enabled: boolean;
    ad_google_client_id: string;
    ad_google_slot_id: string;
    ad_kakao_unit_id: string;
    ad_custom_html: string;
  }>({
    ad_enabled: false,
    ad_google_client_id: '',
    ad_google_slot_id: '',
    ad_kakao_unit_id: '',
    ad_custom_html: '',
  });

  useEffect(() => {
    // 1. 서버 관리자 설정 가져오기
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.settings) {
          setAdConfig({
            ad_enabled: data.settings.ad_enabled === 'true',
            ad_google_client_id: data.settings.ad_google_client_id || '',
            ad_google_slot_id: data.settings.ad_google_slot_id || '',
            ad_kakao_unit_id: data.settings.ad_kakao_unit_id || '',
            ad_custom_html: data.settings.ad_custom_html || '',
          });
        }
      })
      .catch((e) => console.log('Ad settings load skipped:', e));
  }, []);

  // 2. 구글 애드센스 활성화된 경우 광고 push 및 스크립트 동적 로드
  useEffect(() => {
    if (adConfig.ad_google_slot_id && typeof window !== 'undefined') {
      const clientId = adConfig.ad_google_client_id || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
      
      // 애드센스 메인 스크립트가 아직 없으면 동적으로 주입
      const existingScript = document.querySelector('script[src*="adsbygoogle.js"]');
      if (!existingScript && clientId) {
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      const timer = setTimeout(() => {
        try {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
        } catch (e) {
          console.error('AdSense push error:', e);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [adConfig.ad_google_slot_id, adConfig.ad_google_client_id]);

  // 카카오 애드핏 연동
  if (adConfig.ad_kakao_unit_id) {
    return (
      <div className={`w-full flex justify-center my-4 ${className}`}>
        <ins
          className="kakao_ad_area"
          style={{ display: 'none' }}
          data-ad-unit={adConfig.ad_kakao_unit_id}
          data-ad-width={format === 'horizontal' ? '728' : '300'}
          data-ad-height={format === 'horizontal' ? '90' : '250'}
        />
      </div>
    );
  }

  // 구글 애드센스 연동
  if (adConfig.ad_google_slot_id) {
    return (
      <div className={`w-full flex justify-center my-4 ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: format === 'horizontal' ? '90px' : '250px' }}
          data-ad-client={adConfig.ad_google_client_id || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={adConfig.ad_google_slot_id}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // 커스텀 HTML 스크립트 연동
  if (adConfig.ad_custom_html) {
    return (
      <div
        className={`w-full flex justify-center my-4 ${className}`}
        dangerouslySetInnerHTML={{ __html: adConfig.ad_custom_html }}
      />
    );
  }

  // 광고 미등록 시 사용자 및 개발자에게 보이는 안내 배너 (모임방에서도 항상 선명하게 표시!)
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-zinc-900/80 dark:via-indigo-950/30 dark:to-zinc-900/80 p-4 text-center my-4 shadow-sm flex flex-col items-center justify-center transition-all ${
        format === 'horizontal' ? 'w-full min-h-[90px]' : 'w-full max-w-sm min-h-[200px]'
      } ${className}`}
      data-ad-slot={slotId}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        <span className="tracking-wider">광고 배너 영역 (SPONSORED)</span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
        Google AdSense / Kakao AdFit 광고가 표시되는 위치입니다
      </p>
      <a
        href="/admin"
        className="mt-2 text-[10px] text-indigo-500 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium bg-white/80 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50"
      >
        ⚙️ 관리자 대시보드(/admin)에서 광고 등록하기
      </a>
    </div>
  );
};
