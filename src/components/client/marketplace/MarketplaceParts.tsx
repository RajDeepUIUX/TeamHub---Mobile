import React from 'react';
import { Briefcase, Calculator, Check, ClipboardCheck, Clock3, Cog, FileText, Globe, ShieldCheck, UserRound, WandSparkles } from 'lucide-react';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { joinsLabel } from '../data/clientStaffHubData';

/** Desktop domain icons (Tax / Audit / Accounting & Advisory / Specialized / Non Technical) */
const DOMAIN_ICON: Record<string, React.ElementType> = {
  Tax: FileText,
  Audit: ClipboardCheck,
  'Accounting & Advisory': Calculator,
  Specialized: Cog,
  'Non Technical': UserRound,
};

/** One flat tile for every domain (redesign.md §4: no per-category colour); domains differ by icon. Shield = pre-vetted */
export const DomainTile: React.FC<{ domain: string; vetted?: boolean; size?: 'sm' | 'md' }> = ({ domain, vetted, size = 'md' }) => {
  const Icon = DOMAIN_ICON[domain] ?? Briefcase;
  return (
    <span
      className={`relative rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0 ${size === 'sm' ? 'w-9 h-9' : 'w-11 h-11'}`}
      aria-hidden="true"
    >
      <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      {vetted && (
        <span className="absolute -right-1.5 -bottom-1.5 w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center ring-2 ring-white">
          <ShieldCheck className="w-3 h-3" strokeWidth={2.4} />
        </span>
      )}
    </span>
  );
};

/**
 * Small national flags (desktop flag sprites). Windows can't draw flag emoji, so these are inline SVG; like brand logos they keep
 * their own colours only as the small mark itself.
 */
export const CountryFlag: React.FC<{ country: string; className?: string }> = ({ country, className = '' }) => {
  const box = `inline-block w-4 h-[11px] rounded-[2px] ring-1 ring-slate-200 overflow-hidden shrink-0 align-[-1px] ${className}`;
  if (country === 'India')
    return (
      <svg viewBox="0 0 24 16" className={box} role="img" aria-label="India">
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect width="24" height="5.33" fill="#FF9933" />
        <rect y="10.67" width="24" height="5.33" fill="#138808" />
        <circle cx="12" cy="8" r="2" fill="none" stroke="#000080" strokeWidth="0.8" />
      </svg>
    );
  if (country === 'Mexico')
    return (
      <svg viewBox="0 0 24 16" className={box} role="img" aria-label="Mexico">
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect width="8" height="16" fill="#006847" />
        <rect x="16" width="8" height="16" fill="#CE1126" />
        <circle cx="12" cy="8" r="1.8" fill="#8C6A2B" />
      </svg>
    );
  if (country === 'Philippines')
    return (
      <svg viewBox="0 0 24 16" className={box} role="img" aria-label="Philippines">
        <rect width="24" height="8" fill="#0038A8" />
        <rect y="8" width="24" height="8" fill="#CE1126" />
        <path d="M0 0 L13.5 8 L0 16 Z" fill="#FFFFFF" />
        <circle cx="4.5" cy="8" r="1.8" fill="#FCD116" />
      </svg>
    );
  return <Globe className={`w-3.5 h-3.5 text-slate-400 shrink-0 ${className}`} aria-hidden="true" />;
};

/** Checkbox look from redesign.md §6.2 (state comes from the parent control) */
export const CheckMark: React.FC<{ on: boolean; muted?: boolean }> = ({ on, muted }) => (
  <span
    aria-hidden="true"
    className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
      on ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : muted ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300'
    }`}
  >
    {on && <Check className="w-3 h-3" strokeWidth={3} />}
  </span>
);

/** "Joins in 30 Days" / "Immediate Joining" (available = success chip) */
export const JoinsChip: React.FC<{ days: number }> = ({ days }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F8F0] border border-emerald-200/50 text-[11px] font-bold text-[#10B981] whitespace-nowrap">
    <Clock3 className="w-3 h-3" aria-hidden="true" />
    {joinsLabel(days)}
  </span>
);

/** AI-Upskilled flag (violet state, redesign.md §2.5) */
export const AiUpskilledChip: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[11px] font-bold text-[#7C3AED] whitespace-nowrap">
    <WandSparkles className="w-3 h-3" aria-hidden="true" />
    AI-Upskilled
  </span>
);

/** "92% match" from AI Smart Search */
export const MatchBadge: React.FC<{ pct: number; suffix?: string }> = ({ pct, suffix = 'match' }) => (
  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[10px] font-bold text-[#7C3AED] whitespace-nowrap tabular-nums">
    <WandSparkles className="w-3 h-3" aria-hidden="true" />
    {pct}% {suffix}
  </span>
);

export const MarketplaceSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <div className="space-y-3" aria-busy="true" aria-label={label}>
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs space-y-3.5">
        <div className="flex items-start gap-3">
          <StaffSkeleton className="w-11 h-11 rounded-xl" />
          <div className="flex-1 space-y-2 pt-0.5">
            <StaffSkeleton className="w-44 h-4" />
            <StaffSkeleton className="w-52 h-3" />
          </div>
          <StaffSkeleton className="w-9 h-9 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StaffSkeleton className="h-9" />
          <StaffSkeleton className="h-9" />
        </div>
        <StaffSkeleton className="w-32 h-5 rounded-full" />
        <StaffSkeleton className="w-full h-16 rounded-xl" />
        <div className="flex gap-1.5">
          <StaffSkeleton className="w-20 h-6" />
          <StaffSkeleton className="w-24 h-6" />
          <StaffSkeleton className="w-16 h-6" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <StaffSkeleton className="w-20 h-6" />
          <StaffSkeleton className="w-28 h-9" />
        </div>
      </div>
    ))}
  </div>
);
