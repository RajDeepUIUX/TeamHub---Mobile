import React from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { Pill } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { RequirementStatus, statusTone } from '../data/clientRequirementsData';

export const RequirementStatusPill: React.FC<{ status: RequirementStatus }> = ({ status }) => <Pill tone={statusTone(status)}>{status}</Pill>;

export const RequirementListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading requirements">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-44 h-3.5" />
            <StaffSkeleton className="w-24 h-3" />
          </div>
          <StaffSkeleton className="w-16 h-5" />
        </div>
        <StaffSkeleton className="w-full h-16" />
        <div className="flex gap-2">
          <StaffSkeleton className="w-24 h-9" />
          <StaffSkeleton className="w-20 h-9" />
        </div>
      </div>
    ))}
  </div>
);

const STEPS = ['Core Details', 'Additional Details', 'Job Description'];

/** Desktop "Core Details → Additional Details → Job Description" header (current / completed states) */
export const RequirementStepper: React.FC<{ step: 1 | 2 | 3 }> = ({ step }) => (
  <ol className="flex items-start px-4 pt-3 pb-3 bg-white border-b border-[#EBF0F7]" aria-label="Requirement steps">
    {STEPS.map((title, i) => {
      const n = i + 1;
      const done = n < step;
      const current = n === step;
      return (
        <React.Fragment key={title}>
          {i > 0 && <li aria-hidden="true" className={`flex-1 h-0.5 mt-[13px] mx-1.5 rounded-full ${done || current ? 'bg-[#2F68FE]' : 'bg-slate-200'}`} />}
          <li className="flex flex-col items-center gap-1 w-[76px]" aria-current={current ? 'step' : undefined}>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors ${
                done ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : current ? 'bg-[#EFF6FF] border-[#2F68FE] text-[#2F68FE]' : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : n}
            </span>
            <span className={`text-[10.5px] font-semibold text-center leading-tight ${current ? 'text-[#1E293B]' : done ? 'text-[#2F68FE]' : 'text-slate-400'}`}>{title}</span>
          </li>
        </React.Fragment>
      );
    })}
  </ol>
);

/** Desktop "Requirement Created / Updated Successfully!" popup */
export const RequirementSavedSheet: React.FC<{
  isOpen: boolean;
  mode: 'create' | 'edit';
  count: number;
  profile: string;
  onDone: () => void;
  onViewResumes?: () => void;
}> = ({ isOpen, mode, count, profile, onDone, onViewResumes }) => (
  <BottomSheet isOpen={isOpen} onClose={onDone} maxHeight="max-h-[70%]">
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="px-5 pt-3 pb-4 flex flex-col items-center text-center">
      <span className="w-16 h-16 rounded-full bg-[#E8F8F0] text-[#10B981] flex items-center justify-center">
        <Check className="w-8 h-8" strokeWidth={2.5} />
      </span>
      <h2 className="mt-3 text-lg font-extrabold text-[#1E293B]">{mode === 'edit' ? 'Requirement Updated Successfully!' : 'Requirement Created Successfully!'}</h2>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
        {mode === 'edit'
          ? `The requirement for ${profile} has been updated.`
          : count > 1
            ? `${count} requirements for ${profile} have been added (one per staff).`
            : `The requirement for ${profile} has been added.`}{' '}
        You can now review matching profiles available in the Available Staff Hub.
      </p>
    </div>
    <div className={`grid gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0 ${onViewResumes ? 'grid-cols-2' : 'grid-cols-1'}`}>
      <button type="button" onClick={onDone} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
        Done
      </button>
      {onViewResumes && (
        <button type="button" onClick={onViewResumes} className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
          View Available Resumes
        </button>
      )}
    </div>
  </BottomSheet>
);
