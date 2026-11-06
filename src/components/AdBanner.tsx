import React from 'react';

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
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-3 text-center my-4 transition-all ${
        format === 'horizontal' ? 'w-full min-h-[90px]' : 'w-full max-w-sm min-h-[250px]'
      } ${className}`}
      data-ad-slot={slotId}
    >
      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>ADVERTISEMENT AREA</span>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
        구글 애드센스 / 카카오 애드핏 광고 슬롯 ({format})
      </p>
    </div>
  );
};
