import React, { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { ChipRow, SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { ML_STATUSES, MandatoryCourse, MlAssignment, MlStatus, countsOf, formatHours, formatMlDate, newestAssignedFirst } from '../data/clientMandatoryLearningData';
import { MlProgress, MlStatusPill } from './MandatoryLearningParts';

type StatusChip = 'All' | MlStatus;
const STATUS_CHIPS: StatusChip[] = ['All', ...ML_STATUSES];

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
  const [chip, setChip] = useState<StatusChip>('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setChip('All');
    setLoading(true);
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [isOpen, course?.id]);

  const assignments = useMemo(() => [...(course?.assignments ?? [])].sort(newestAssignedFirst), [course]);
  const counts = countsOf(assignments);
  const memberOf = (id: string) => staff.find((s) => s.id === id);
  const rows = assignments.filter((a) => chip === 'All' || a.status === chip);

  const row = (a: MlAssignment) => {
    const m = memberOf(a.staffId);
    return (
      <li key={a.staffId} className="p-3 rounded-2xl bg-white border border-[#DCE3ED] shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)]">
        <div className="flex items-center gap-3">
          {m && <StaffAvatar name={m.name} tint={tintOf(m.id)} />}
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-[#1E293B] truncate">{m?.name ?? 'Staff'}</span>
            <span className="block text-[11px] text-slate-500 truncate">{m?.designation}</span>
          </span>
          <MlStatusPill status={a.status} />
        </div>
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
      <SheetHeader title="Progress Details" subtitle={course ? `${course.name} · ${formatHours(course.hours)}` : undefined} onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading progress details">
            <StaffSkeleton className="w-full h-12 rounded-xl" />
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
          <>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="flex items-center justify-between gap-3 text-[12px]">
                <span className="font-semibold text-slate-600">
                  <span className="font-extrabold text-[#1E293B] tabular-nums">{counts.completed}</span> of <span className="tabular-nums">{counts.assigned}</span> staff completed
                </span>
                <span className={`font-extrabold tabular-nums ${counts.percent === 100 ? 'text-[#10B981]' : 'text-[#2F68FE]'}`}>{counts.percent}%</span>
              </p>
              <div className="mt-2">
                <MlProgress completed={counts.completed} assigned={counts.assigned} />
              </div>
            </div>

            <div className="mt-3">
              <ChipRow
                options={STATUS_CHIPS}
                value={chip}
                onChange={setChip}
                label="Status"
                counts={{ All: counts.assigned, Completed: counts.completed, 'In-Progress': counts.inProgress, 'Not Started': counts.notStarted }}
              />
            </div>

            {rows.length === 0 ? (
              <p className="mt-6 text-center text-xs text-slate-500">No staff are {chip.toLowerCase()} for this course.</p>
            ) : (
              <ul className="mt-3 space-y-3 pb-4">{rows.map(row)}</ul>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
};
