'use client';

import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  slotId?: string;
  className?: string;
  format?: 'horizontal' | 'rectangle';
  /**
   * 카카오 애드핏 연동 시 (예: 'DAN-xxxxxxxx')
   */
  adFitUnit?: string;
  /**
   * 구글 애드센스 슬롯 ID (예: '1234567890')
   */
  adSenseSlot?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId = 'sample-slot',
  className = '',
  format = 'horizontal',
  adFitUnit = process.env.NEXT_PUBLIC_ADFIT_UNIT_ID,
  adSenseSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. 구글 애드센스 광고 초기화
    if (adSenseSlot && typeof window !== 'undefined') {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [adSenseSlot]);

  const hasRealAd = Boolean(adFitUnit || adSenseSlot);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl transition-all my-4 flex flex-col items-center justify-center ${
        format === 'horizontal' ? 'w-full min-h-[90px]' : 'w-full max-w-sm min-h-[250px]'
      } ${
        !hasRealAd
          ? 'border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-4 text-center'
          : 'bg-transparent'
      } ${className}`}
      data-ad-slot={slotId}
    >
      {/* 1. 카카오 애드핏 실제 연동 */}
      {adFitUnit ? (
        <ins
          className="kakao_ad_area"
          style={{ display: 'none' }}
          data-ad-unit={adFitUnit}
          data-ad-width={format === 'horizontal' ? '728' : '300'}
          data-ad-height={format === 'horizontal' ? '90' : '250'}
        />
      ) : adSenseSlot ? (
        /* 2. 구글 애드센스 실제 연동 */
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: format === 'horizontal' ? '90px' : '250px' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={adSenseSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        /* 3. 광고 설정 전 프리뷰 플레이스홀더 */
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>SPONSORED ADVERTISEMENT</span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            구글 애드센스 / 카카오 애드핏 광고가 노출되는 영역입니다 ({format})
          </p>
        </div>
      )}
    </div>
  );
};
