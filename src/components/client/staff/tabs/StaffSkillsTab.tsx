import React from 'react';
import { Award, GraduationCap } from 'lucide-react';
import type { StaffSkills } from '../../data/clientStaffProfileData';
import { Card, Pill, TabTitle } from './StaffTabParts';

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

/** Desktop "Skills & Qualification" tab (skills_qualification.tpl) */
export const StaffSkillsTab: React.FC<{ skills: StaffSkills }> = ({ skills }) => (
  <>
    <TabTitle title="Skills & Certifications" />
    <Card className="mt-2.5 p-4 space-y-4">
      <ChipList title="Technical Skills" items={skills.technical} />
      <div className="pt-4 border-t border-slate-100">
        <ChipList title="Software Skills" items={skills.software} />
      </div>
      {skills.education.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-bold text-[#1D4ED8]">Education</h4>
          <ul className="mt-2.5 space-y-2">
            {skills.education.map((e) => (
              <li key={e} className="flex items-start gap-2.5 text-[12.5px] text-[#1E293B]">
                <GraduationCap className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>

    {skills.certificates.length > 0 && (
      <>
        <h4 className="mt-4 px-1 text-sm font-bold text-[#1E293B]">Academic Certifications</h4>
        <ul className="mt-2.5 space-y-2.5">
          {skills.certificates.map((c) => (
            <li key={c.name}>
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
