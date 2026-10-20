import React from 'react';
import { Briefcase, Calculator, BookOpenCheck, Lightbulb, Scale, ShieldCheck } from 'lucide-react';
import { StaffSkeleton } from '../staff/ClientStaffParts';

/** Domain icon tile (desktop shows a small document icon before the domain) */
const DOMAIN_ICON: Record<string, { icon: React.ElementType; tint: string }> = {
  Tax: { icon: Calculator, tint: 'bg-[#EFF6FF] text-[#2F68FE]' },
  'Accounting & Bookkeeping': { icon: BookOpenCheck, tint: 'bg-[#E8F8F0] text-[#10B981]' },
  'Audit & Assurance': { icon: ShieldCheck, tint: 'bg-[#EEF2FF] text-[#4F46E5]' },
  'Business Valuation': { icon: Scale, tint: 'bg-[#FEF8E7] text-[#D97706]' },
  Advisory: { icon: Lightbulb, tint: 'bg-[#FDF2F8] text-[#DB2777]' },
};

export const DomainTile: React.FC<{ domain: string }> = ({ domain }) => {
  const { icon: Icon, tint } = DOMAIN_ICON[domain] ?? { icon: Briefcase, tint: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tint}`} aria-hidden="true">
      <Icon className="w-4 h-4" />
    </span>
  );
};

export const HubListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading resumes">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center gap-2">
          <StaffSkeleton className="w-7 h-7" />
          <StaffSkeleton className="w-32 h-3" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <StaffSkeleton className="w-44 h-4" />
          <StaffSkeleton className="w-14 h-5" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StaffSkeleton className="h-8" />
          <StaffSkeleton className="h-8" />
          <StaffSkeleton className="h-8" />
        </div>
        <StaffSkeleton className="w-full h-10" />
        <div className="flex gap-1.5">
          <StaffSkeleton className="w-20 h-6" />
          <StaffSkeleton className="w-24 h-6" />
          <StaffSkeleton className="w-16 h-6" />
        </div>
        <div className="flex items-center justify-between">
          <StaffSkeleton className="w-16 h-5" />
          <StaffSkeleton className="w-28 h-9" />
        </div>
      </div>
    ))}
  </div>
);
