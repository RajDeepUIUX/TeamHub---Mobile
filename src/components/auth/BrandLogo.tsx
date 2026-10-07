import React from 'react';

/** Official brand assets (served from /public/brand) */
const BRAND = {
  stacked: '/brand/Logo.png', // 1077×896 — icon above "MYCPE ONE"
  horizontal: '/brand/logo-horizontal.png', // 607×76 — icon beside "MYCPE ONE"
  icon: '/brand/Icon.png', // icon only
};

/** Icon-only mark */
export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <img src={BRAND.icon} alt="MYCPE ONE" className={`${className} object-contain`} draggable={false} />
);

/** Horizontal lockup for in-app headers. Height drives the size; width follows the 8:1 ratio. */
export const BrandLogoHorizontal: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <img
    src={BRAND.horizontal}
    alt="MYCPE ONE"
    className={`${className} w-auto object-contain select-none`}
    draggable={false}
  />
);

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

// Widths for the stacked logo (aspect ratio ≈ 1.2 : 1, so height follows automatically)
const SIZES = {
  sm: { width: 'w-[132px]', tag: 'text-[11px] tracking-[0.3em] mt-2.5' },
  md: { width: 'w-[168px]', tag: 'text-xs tracking-[0.32em] mt-3' },
  lg: { width: 'w-[208px]', tag: 'text-[13px] tracking-[0.35em] mt-4' },
};

/** Stacked lockup for splash + auth screens: MYCPE ONE + the "HRMS 247" product name */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showTagline = true }) => {
  const s = SIZES[size];
  return (
    <div className="flex flex-col items-center">
      <img
        src={BRAND.stacked}
        alt="MYCPE ONE"
        className={`${s.width} h-auto aspect-[1077/896] object-contain drop-shadow-[0_12px_20px_rgba(99,102,241,0.18)] select-none`}
        draggable={false}
      />
      {showTagline && (
        <p className={`font-extrabold bg-linear-to-r from-[#2F68FE] to-[#7C3AED] bg-clip-text text-transparent ${s.tag}`}>HRMS 247</p>
      )}
    </div>
  );
};
