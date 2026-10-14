import React from 'react';

/** Official brand assets (served from /public/brand) */
const BRAND = {
  logo: '/brand/logo-hrms247.png', // 336×80 — icon + "MYCPE ONE" + "HRMS 24*7" badge
  icon: '/brand/Icon.png', // icon only
};

/** Icon-only mark */
export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <img src={BRAND.icon} alt="MYCPE ONE" className={`${className} object-contain`} draggable={false} />
);

/** Logo for in-app headers. Height drives the size; width follows the 4.2:1 ratio. */
export const BrandLogoHorizontal: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <img
    src={BRAND.logo}
    alt="MYCPE ONE HRMS 24*7"
    className={`${className} w-auto object-contain select-none`}
    draggable={false}
  />
);

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

// Widths for the splash / sign-in logo (height follows the 336×80 artwork)
const SIZES = {
  sm: 'w-[200px]',
  md: 'w-[230px]',
  lg: 'w-[260px]',
};

/** Logo for splash + sign-in screens (the "HRMS 24*7" badge is part of the artwork) */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md' }) => (
  <img
    src={BRAND.logo}
    alt="MYCPE ONE HRMS 24*7"
    className={`block mx-auto ${SIZES[size]} h-auto aspect-[336/80] object-contain drop-shadow-[0_10px_18px_rgba(99,102,241,0.15)] select-none`}
    draggable={false}
  />
);
