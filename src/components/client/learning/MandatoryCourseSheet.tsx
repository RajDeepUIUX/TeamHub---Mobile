import React, { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { MandatoryCourse, MlAssignment, formatMlDate, newestAssignedFirst } from '../data/clientMandatoryLearningData';
import { MlStatusPill } from './MandatoryLearningParts';

/** Desktop loads the panel by ajax (spinner) */
const LOAD_MS = 350;

interface Props {
  isOpen: boolean;
  course: MandatoryCourse | null;
  staff: ClientStaffMember[];
  /** Avatar colour index per staff id, same as My Staff */
  tintOf: (staffId: string) => number;
  onClose: () => void;
}

/** Desktop "Progress Details" offcanvas (`get_course_users`): per staff Assigned On, Completed On and Status, newest assignment first */
export const MandatoryCourseSheet: React.FC<Props> = ({ isOpen, course, staff, tintOf, onClose }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [isOpen, course?.id]);

  const assignments = useMemo(() => [...(course?.assignments ?? [])].sort(newestAssignedFirst), [course]);
  const memberOf = (id: string) => staff.find((s) => s.id === id);

  const row = (a: MlAssignment) => {
    const m = memberOf(a.staffId);
    return (
      <li key={a.staffId} className="p-3 rounded-2xl bg-white border border-[#DCE3ED] shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)]">
        <dl className="flex items-center gap-3">
          {m && <StaffAvatar name={m.name} tint={tintOf(m.id)} />}
          <div className="flex-1 min-w-0">
            <dt className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">User Name</dt>
            <dd className="mt-0.5 text-[13px] font-bold text-[#1E293B] truncate">{m?.name ?? 'Staff'}</dd>
          </div>
          <div className="shrink-0 text-right">
            <dt className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</dt>
            <dd className="mt-0.5">
              <MlStatusPill status={a.status} />
            </dd>
          </div>
        </dl>
        <dl className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <dt className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">Assigned On</dt>
            <dd className="mt-0.5 text-[12px] font-semibold text-[#1E293B] tabular-nums">{formatMlDate(a.assignedOn)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">Completed On</dt>
            <dd className="mt-0.5 text-[12px] font-semibold text-[#1E293B] tabular-nums">{formatMlDate(a.completedOn)}</dd>
          </div>
        </dl>
      </li>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Progress Details" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading progress details">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-3 rounded-2xl bg-white border border-[#DCE3ED] space-y-3">
                <div className="flex items-center gap-3">
                  <StaffSkeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <StaffSkeleton className="w-28 h-3.5" />
                    <StaffSkeleton className="w-36 h-3" />
                  </div>
                </div>
                <StaffSkeleton className="w-full h-8" />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-8 flex flex-col items-center text-center">
            <span className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">No users found for this course.</p>
          </div>
        ) : (
          <ul className="space-y-3 pb-4">{assignments.map(row)}</ul>
        )}
      </div>
    </BottomSheet>
  );
};
