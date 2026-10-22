import React from 'react';
import { Award, Laptop, Sparkles } from 'lucide-react';
import type { StaffSkills } from '../../data/clientStaffProfileData';
import { Card, CardHeading, Pill } from './StaffTabParts';

const ChipList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h4 className="text-sm font-bold text-[#1D4ED8]">{title}</h4>
    {items.length === 0 ? (
      <p className="mt-2 text-xs text-slate-400">No Skills Found</p>
    ) : (
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {items.map((s) => (
          <span key={s} className="h-7 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11.5px] font-semibold text-slate-600 inline-flex items-center">
            {s}
          </span>
        ))}
      </div>
    )}
  </div>
);

/** V2: one card per skill group, tinted chips */
const SkillCardV2: React.FC<{ title: string; icon: React.ElementType; items: string[]; chip: string }> = ({ title, icon, items, chip }) => (
  <Card className="p-4">
    <CardHeading icon={icon} title={title} trailing={<Pill tone="slate">{items.length}</Pill>} />
    {items.length === 0 ? (
      <p className="mt-3 text-xs text-slate-400">No Skills Found</p>
    ) : (
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {items.map((s) => (
          <span key={s} className={`h-7 px-3 rounded-full text-[11.5px] font-semibold inline-flex items-center ${chip}`}>
            {s}
          </span>
        ))}
      </div>
    )}
  </Card>
);

/** Desktop "Skills & Qualification" tab (skills_qualification.tpl) */
export const StaffSkillsTab: React.FC<{ skills: StaffSkills; v2?: boolean }> = ({ skills, v2 }) =>
  v2 ? (
    <div className="mt-2.5 space-y-3">
      <SkillCardV2 title="Technical Skills" icon={Sparkles} items={skills.technical} chip="bg-[#EFF6FF] text-[#1D4ED8]" />
      <SkillCardV2 title="Software Skills" icon={Laptop} items={skills.software} chip="bg-[#EEF2FF] text-[#4F46E5]" />
      {skills.certificates.length > 0 && (
        <Card className="p-4">
          <CardHeading icon={Award} title="Academic Certifications" trailing={<Pill tone="slate">{skills.certificates.length}</Pill>} />
          <ol className="mt-3.5 relative">
            {skills.certificates.map((c, i) => (
              <li key={`${c.name}-${i}`} className="relative pl-6 pb-3.5 last:pb-0">
                {i < skills.certificates.length - 1 && <span aria-hidden="true" className="absolute left-[5px] top-3 bottom-0 w-px bg-slate-200" />}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1 w-[11px] h-[11px] rounded-full ring-2 ring-white ${c.status === 'Completed' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-[#1E293B] leading-snug">{c.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Certification Type: {c.type}</p>
                  </div>
                  <Pill tone={c.status === 'Completed' ? 'green' : 'amber'}>{c.status}</Pill>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  ) : (
  <>
    <Card className="p-4 space-y-4">
      <ChipList title="Technical Skills" items={skills.technical} />
      <div className="pt-4 border-t border-slate-100">
        <ChipList title="Software Skills" items={skills.software} />
      </div>
    </Card>

    {skills.certificates.length > 0 && (
      <>
        <h4 className="mt-4 px-1 text-sm font-bold text-[#1E293B]">Academic Certifications</h4>
        <ul className="mt-2.5 space-y-2.5">
          {skills.certificates.map((c, i) => (
            <li key={`${c.name}-${i}`}>
              <Card className="p-3.5 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{c.name}</p>
                  <p className="text-[11px] text-slate-400">Certification Type: {c.type}</p>
                </div>
                <Pill tone={c.status === 'Completed' ? 'green' : 'amber'}>{c.status}</Pill>
              </Card>
            </li>
          ))}
        </ul>
      </>
    )}
  </>
  );
