import React from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { Pill } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { RequirementStatus, statusTone } from '../data/clientRequirementsData';

export const RequirementStatusPill: React.FC<{ status: RequirementStatus }> = ({ status }) => <Pill tone={statusTone(status)}>{status}</Pill>;

/** V1: soft card — icon tile + title, 2×2 fact tiles, 3-column strip, pill actions */
export const RequirementListSkeletonV1: React.FC = () => (
  <div className="space-y-3.5" aria-busy="true" aria-label="Loading requirements">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-2xl pl-5 pr-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-16 h-2.5" />
            <StaffSkeleton className="w-40 h-3.5" />
          </div>
          <StaffSkeleton className="w-20 h-5 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((j) => (
            <StaffSkeleton key={j} className="h-12 rounded-xl" />
          ))}
        </div>
        <StaffSkeleton className="w-full h-14 rounded-xl" />
        <div className="flex gap-2">
          <StaffSkeleton className="flex-1 h-10 rounded-full" />
          <StaffSkeleton className="flex-1 h-10 rounded-full" />
          <StaffSkeleton className="flex-1 h-10 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

/** V2: compact ticket — status band, title, 2-up figures, rows, link tiles, segmented footer */
export const RequirementListSkeletonV2: React.FC = () => (
  <div className="space-y-2.5" aria-busy="true" aria-label="Loading requirements">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="h-9 px-3.5 flex items-center bg-[#F8FAFC] border-b border-[#EBF0F7]">
          <StaffSkeleton className="w-20 h-3" />
        </div>
        <div className="px-3.5 py-3 space-y-3">
          <StaffSkeleton className="w-44 h-4" />
          <StaffSkeleton className="w-full h-14 rounded-lg" />
          <div className="space-y-2.5">
            <StaffSkeleton className="w-full h-3" />
            <StaffSkeleton className="w-full h-3" />
            <StaffSkeleton className="w-full h-3" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StaffSkeleton className="h-12 rounded-lg" />
            <StaffSkeleton className="h-12 rounded-lg" />
          </div>
        </div>
        <div className="h-11 border-t border-slate-100" />
      </div>
    ))}
  </div>
);

const STEPS = ['Core Details', 'Additional Details', 'Job Description'];

/** Desktop "1 Core Details ---- 2 Additional Details ---- 3 Job Description" box (current / completed states) */
export const RequirementStepper: React.FC<{ step: 1 | 2 | 3 }> = ({ step }) => (
  <ol className="flex items-start px-2 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]" aria-label="Requirement steps">
    {STEPS.map((title, i) => {
      const n = i + 1;
      const done = n < step;
      const current = n === step;
      return (
        <React.Fragment key={title}>
          {i > 0 && <li aria-hidden="true" className={`flex-1 mt-[15px] border-t border-dashed transition-colors ${n <= step ? 'border-[#2F68FE]' : 'border-slate-400'}`} />}
          <li className="flex flex-col items-center gap-1.5 w-[82px]" aria-current={current ? 'step' : undefined}>
            <span
              className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-semibold border transition-colors ${
                done || current ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-600 text-slate-700'
              }`}
            >
              {done ? <Check className="w-4 h-4" strokeWidth={3} /> : n}
            </span>
            <span className={`text-[11px] leading-tight text-center ${current || done ? 'font-semibold text-[#2F68FE]' : 'font-medium text-slate-600'}`}>{title}</span>
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
