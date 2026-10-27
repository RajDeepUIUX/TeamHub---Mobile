import React from 'react';
import { Award, BadgeCheck, CheckCircle2, Clock3, Laptop, Sparkles } from 'lucide-react';
import type { StaffCertificate, StaffSkills } from '../../data/clientStaffProfileData';
import { Card, Pill } from './StaffTabParts';

const certTone = (c: StaffCertificate) => (c.status === 'Completed' ? 'green' : 'amber');

/** Count cell in the summary strip */
const StatCell: React.FC<{ icon: React.ElementType; value: number; label: string; tint: string }> = ({ icon: Icon, value, label, tint }) => (
  <div className="px-1.5 py-3 flex flex-col items-center text-center min-w-0">
    <span className="flex items-center gap-1.5">
      <span className={`w-6 h-6 rounded-md flex items-center justify-center ${tint}`} aria-hidden="true">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="text-lg font-extrabold text-[#1E293B] leading-none tabular-nums">{value}</span>
    </span>
    <span className="mt-1.5 min-h-[26px] flex items-center text-[10px] font-semibold text-slate-500 leading-tight">{label}</span>
  </div>
);

/** Card heading row: icon, title, hairline under */
const SectionHead: React.FC<{ icon: React.ElementType; title: string; iconCls: string }> = ({ icon: Icon, title, iconCls }) => (
  <h4 className="pb-3 mb-3 border-b border-slate-100 flex items-center gap-2 text-[13px] font-bold text-[#1E293B]">
    <Icon className={`w-4 h-4 shrink-0 ${iconCls}`} />
    {title}
  </h4>
);

/** Section: card with two-column skill tiles of equal height */
const SkillGrid: React.FC<{ title: string; icon: React.ElementType; items: string[]; iconCls: string }> = ({ title, icon, items, iconCls }) => (
  <Card className="p-4">
    <SectionHead icon={icon} title={title} iconCls={iconCls} />
    {items.length === 0 ? (
      <p className="text-xs text-slate-400">No Skills Found</p>
    ) : (
      <ul className="grid grid-cols-2 auto-rows-fr gap-2">
        {items.map((s) => (
          <li key={s} className="px-2.5 py-2 rounded-xl bg-[#F8FAFC] border border-slate-100 flex items-center gap-2 text-xs font-semibold text-[#1E293B] leading-snug">
            <BadgeCheck className={`w-3.5 h-3.5 shrink-0 ${iconCls}`} />
            <span className="min-w-0 break-words">{s}</span>
          </li>
        ))}
      </ul>
    )}
  </Card>
);

/** Certificate row: status icon, name, type + status */
const CertificateRow: React.FC<{ cert: StaffCertificate }> = ({ cert: c }) => {
  const done = c.status === 'Completed';
  const StatusIcon = done ? CheckCircle2 : Clock3;
  return (
    <div className="flex items-start gap-3">
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${done ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FFFBEB] text-[#F59E0B]'}`}
        aria-hidden="true"
      >
        <StatusIcon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#1E293B] leading-snug">{c.name}</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-400 min-w-0 truncate">
            Certification Type: <span className="font-semibold text-slate-600">{c.type}</span>
          </p>
          <Pill tone={certTone(c)}>{c.status}</Pill>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------- Tab ----------------------------------- */

/** Desktop "Skills & Qualification" tab (skills_qualification.tpl) */
export const StaffSkillsTab: React.FC<{ skills: StaffSkills }> = ({ skills }) => (
  <div className="mt-2.5 space-y-3">
    <Card className="grid grid-cols-3 divide-x divide-slate-100">
      <StatCell icon={Sparkles} value={skills.technical.length} label="Technical Skills" tint="bg-[#EFF6FF] text-[#2F68FE]" />
      <StatCell icon={Laptop} value={skills.software.length} label="Software Skills" tint="bg-[#EEF2FF] text-[#4F46E5]" />
      <StatCell icon={Award} value={skills.certificates.length} label="Academic Certifications" tint="bg-[#ECFDF5] text-[#10B981]" />
    </Card>

    <SkillGrid title="Technical Skills" icon={Sparkles} items={skills.technical} iconCls="text-[#2F68FE]" />
    <SkillGrid title="Software Skills" icon={Laptop} items={skills.software} iconCls="text-[#4F46E5]" />

    {skills.certificates.length > 0 && (
      <Card className="p-4">
        <SectionHead icon={Award} title="Academic Certifications" iconCls="text-[#10B981]" />
        <ul className="divide-y divide-slate-100">
          {skills.certificates.map((c, i) => (
            <li key={`${c.name}-${i}`} className="py-3 first:pt-0 last:pb-0">
              <CertificateRow cert={c} />
            </li>
          ))}
        </ul>
      </Card>
    )}
  </div>
);
