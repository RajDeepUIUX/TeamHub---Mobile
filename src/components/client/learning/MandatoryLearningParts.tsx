import React from 'react';
import { MlStatus } from '../data/clientMandatoryLearningData';
import { Pill, Tone } from '../staff/tabs/StaffTabParts';

/** Desktop badges: Completed green, In-Progress amber, anything else grey */
const STATUS_TONE: Record<MlStatus, Tone> = {
  Completed: 'green',
  'In-Progress': 'amber',
  'Not Started': 'slate',
};

export const MlStatusPill: React.FC<{ status: MlStatus }> = ({ status }) => <Pill tone={STATUS_TONE[status]}>{status}</Pill>;

/** "x of y staff completed" bar: blue while in progress, green once everyone is done */
export const MlProgress: React.FC<{ completed: number; assigned: number }> = ({ completed, assigned }) => {
  const percent = assigned ? Math.round((completed / assigned) * 100) : 0;
  const done = assigned > 0 && completed === assigned;
  return (
    <div
      role="progressbar"
      aria-label={`${completed} of ${assigned} staff completed`}
      aria-valuemin={0}
      aria-valuemax={assigned}
      aria-valuenow={completed}
      className="h-2 rounded-full bg-slate-100 overflow-hidden"
    >
      <div className={`h-full rounded-full transition-all duration-300 ${done ? 'bg-[#10B981]' : 'bg-[#2F68FE]'}`} style={{ width: `${percent}%` }} />
    </div>
  );
};
