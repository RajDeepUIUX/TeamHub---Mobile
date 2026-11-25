import React from 'react';

// MyCPE icons drawn to match the designs (lucide has no equivalent). 24 × 24, currentColor.
type IconProps = { className?: string };

const Svg: React.FC<IconProps & { children: React.ReactNode; w?: number }> = ({ className, children, w = 1.6 }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const Dot: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 1.35 }) => <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none" />;

/* ------------------------------- Course formats ------------------------------- */

export const LiveWebinarIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <rect x="3.6" y="1.8" width="16.8" height="7.6" rx="0.8" />
    {[3.8, 12, 20.2].map((x) => (
      <React.Fragment key={x}>
        <Dot x={x} y={15.4} />
        <path d={`M${x - 2.5} 22v-2.1a.9.9 0 0 1 .9-.9h3.2a.9.9 0 0 1 .9.9V22`} strokeLinecap="butt" />
      </React.Fragment>
    ))}
    <Dot x={8} y={12.6} />
    <Dot x={16} y={12.6} />
  </Svg>
);
export const OnDemandIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <rect x="1.8" y="4.6" width="20.4" height="14.8" rx="1" />
    <path d="M9.8 8.4v7.2l5.6-3.6z" fill="currentColor" stroke="none" />
  </Svg>
);
export const EBookIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <rect x="1.8" y="4" width="20.4" height="16" rx="1" />
    <path d="M12 4v16M5 8.2h4M5 12h4M5 15.8h4M15 8.2h4M15 12h4M15 15.8h4" strokeLinecap="butt" />
  </Svg>
);
export const PodcastIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <rect x="8.4" y="1.8" width="7.2" height="13.2" rx="3.6" />
    <path d="M5.4 11v.6a6.6 6.6 0 0 0 13.2 0V11M12 18.2v3.6M8.4 22h7.2" strokeLinecap="butt" />
  </Svg>
);

/* --------------------------------- Bottom nav --------------------------------- */

export const NavHomeIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M9.9 2.6a3.6 3.6 0 0 1 4.2 0l5.9 4.1a4.6 4.6 0 0 1 2 3.8v6.7a4.8 4.8 0 0 1-4.8 4.8H6.800A4.800 4.800 0 0 1 2 17.200v-6.700a4.600 4.600 0 0 1 2-3.800z" fill="currentColor" />
    <rect x="11.200" y="14.200" width="1.600" height="4.800" rx="0.800" fill="#EAECF0" />
  </svg>
);
export const NavLibraryIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className} w={1.5}>
    <circle cx="11.500" cy="11.500" r="9.700" />
    <path d="M20 20l2 2" />
  </Svg>
);
export const NavPlanIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 3.200c.700 0 1.300.400 1.600 1l3 6.400 2.700-2.500c1.400-1.200 3.100-.300 2.700 1.400l-2 9.400c-.200.900-.900 1.500-1.800 1.500H5.800c-.900 0-1.600-.600-1.800-1.500L2 9.500c-.400-1.700 1.300-2.600 2.700-1.400l2.700 2.500 3-6.400c.300-.600.900-1 1.600-1z"
      fill="#F79009"
    />
  </svg>
);
export const NavCoursesIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className} w={1.5}>
    <rect x="2" y="2.600" width="20" height="15.600" rx="2.200" />
    <path d="M10 7.800c0-.900.900-1.400 1.600-.900l3.600 2.500c.700.500.700 1.500 0 2l-3.600 2.500c-.700.500-1.600 0-1.600-.900zM1.400 21.800h21.200" />
  </Svg>
);
export const NavInsightsIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className} w={1.5}>
    <path d="M5 19.200V6.200a1.200 1.200 0 0 1 1.200-1.200h14.600A1.200 1.200 0 0 1 22 6.200v11.800a1.200 1.200 0 0 1-1.200 1.200H3.600A1.600 1.600 0 0 1 2 17.600V8.400M9.400 10.400h8M9.400 13.800h8" />
  </Svg>
);

/* ---------------------------------- Profile ---------------------------------- */

export const PreferenceIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <rect x="2" y="3.400" width="6.600" height="6.600" rx="0.800" />
    <rect x="2" y="14" width="6.600" height="6.600" rx="0.800" />
    <path d="M12.400 6.700H22M12.400 17.300H22" strokeLinecap="butt" />
  </Svg>
);
export const ComplianceIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M22 11V4.200a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v14.600a1 1 0 0 0 1 1h9M5 6.800h7M5 10h7M5 13h4.200" strokeLinecap="butt" />
    <path d="M17.600 12.400l1.300 2.800 3.100.300-2.300 2 .700 3-2.800-1.600-2.700 1.600.700-3-2.300-2 3-.300z" fill="currentColor" stroke="none" />
  </Svg>
);
export const CertificateIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M17 6.200V3.200a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v17.600a1 1 0 0 0 1 1h7M6.600 7.200H14M6.600 11.600h5" strokeLinecap="butt" />
    <circle cx="17.200" cy="14" r="3.800" />
    <path d="M15.200 17.400v4.400l2-1.200 2 1.200v-4.400" />
  </Svg>
);
export const DollarIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className} w={2}>
    <path d="M17 7.600C16 5.600 14.200 4.800 12 4.800c-2.800 0-4.800 1.400-4.800 3.600 0 5 9.800 2.400 9.800 7.400 0 2.200-2.100 3.600-5 3.600-2.400 0-4.400-1-5.400-3M12 2v2.800M12 19.400V22" strokeLinecap="butt" />
  </Svg>
);
export const InvoiceIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M2.600 20.600V4.400a1 1 0 0 1 1-1h16.800a1 1 0 0 1 1 1v16.200l-3.100-1.700-3.200 1.700-3.100-1.700-3.100 1.700-3.200-1.700zM7 9.600h10M7 12.800h10" />
  </Svg>
);
export const AppTourIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M14.600 1.800H5a1 1 0 0 0-1 1v18.400a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6.400" strokeLinecap="butt" />
    <Dot x={10} y={18.600} r={1.200} />
    <path d="M12.800 5.800h3v3h-3zM17.200 5.800h3v3h-3zM12.800 10.200h3v3h-3zM17.200 10.200h3v3h-3z" fill="currentColor" stroke="none" />
  </Svg>
);
export const LogoutIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className} w={1.8}>
    <path d="M9.600 2.800H4.200a1 1 0 0 0-1 1v16.400a1 1 0 0 0 1 1h5.400M9 12h12M16.400 7.200L21.200 12l-4.800 4.800" />
  </Svg>
);
export const NoLicenseIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className} w={1.500}>
    <path d="M14.600 1.200H4.200a.800.800 0 0 0-.800.800v20a.800.800 0 0 0 .800.800h15.600a.800.800 0 0 0 .800-.800V7.200zM14.600 1.200v6h6M9.200 11.800l5.600 5.600M14.800 11.800l-5.600 5.600" strokeLinecap="butt" />
  </Svg>
);
/** Rosette with a tick, in the "Approved for" tags */
export const ApprovedIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className} w={1.500}>
    <path
      d="M12 1.800l2.300 1.900 2.900-.600 1.300 2.700 2.800 1-.2 3 1.900 2.200-1.900 2.200.2 3-2.800 1-1.300 2.700-2.900-.600L12 22.200l-2.300-1.900-2.900.600-1.300-2.700-2.800-1 .2-3L1 12l1.900-2.200-.2-3 2.800-1 1.300-2.700 2.900.600z"
      fill="#D9D3FA"
    />
    <path d="M8 12.200l2.800 2.800L16 9.600" />
  </Svg>
);

/* -------------------------------- Illustration -------------------------------- */

const BADGE = Array.from({ length: 28 }, (_, i) => {
  const r = i % 2 ? 17.4 : 20;
  const a = (i * Math.PI) / 14 - Math.PI / 2;
  return `${(226 + r * Math.cos(a)).toFixed(1)},${(109.5 + r * Math.sin(a)).toFixed(1)}`;
}).join(' ');

/** Credit Certificates: nothing earned yet */
export const NoCertificatesArt: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="124 18 136 124" className={className} aria-hidden="true">
    <rect x="126" y="32" width="60" height="88" rx="6" fill="#CFD4DE" />
    <rect x="132" y="32" width="125" height="88" rx="6" fill="#98A2B3" />
    <path d="M155 43H228A17 15 0 0 0 245 58V94A17 15 0 0 0 228 109H155A17 15 0 0 0 138 94V58A17 15 0 0 0 155 43Z" fill="#F4F8F9" />
    <path d="M163 61h44M151 75h81" stroke="#BCC5CF" strokeWidth="4.400" strokeLinecap="round" />
    <path d="M213 119l-4.500 18 5.500-2.800 3.500 5 4.500-18zM239 119l4.500 18-5.500-2.800-3.500 5-4.500-18z" fill="#FF3D51" />
    <path d="M144.500 127.500l100-100" stroke="#475467" strokeWidth="15" strokeLinecap="round" />
    <polygon points={BADGE} fill="#FFA62E" />
    <circle cx="226.500" cy="109.500" r="11.800" fill="#FFD23B" />
  </svg>
);
