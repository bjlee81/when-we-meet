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
            ad_google_client_id: data.settings.ad_google_client_id || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
            ad_google_slot_id: data.settings.ad_google_slot_id || process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || '',
            ad_kakao_unit_id: data.settings.ad_kakao_unit_id || process.env.NEXT_PUBLIC_ADFIT_UNIT_ID || '',
            ad_custom_html: data.settings.ad_custom_html || '',
          });
        }
      })
      .catch((e) => {
        // 네트워크 실패 시 환경변수 fallback
        setAdConfig((prev) => ({
          ...prev,
          ad_google_client_id: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
          ad_google_slot_id: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || '',
          ad_kakao_unit_id: process.env.NEXT_PUBLIC_ADFIT_UNIT_ID || '',
        }));
      });
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

  // 광고가 미설정된 경우: 일반 사용자 화면에서는 깔끔하게 아무것도 노출하지 않음 (빈 박스/관리자 유도 배너 제거)
  return null;
};
