import React, { useState } from 'react';
import { BookOpen, ChevronRight, ScanSearch } from 'lucide-react';
import { formatStaffDate } from '../../data/clientStaffData';
import { TRAINING_TYPES, TrainingRecord, TrainingType } from '../../data/clientStaffProfileData';
import { TniStatusPill } from '../../training/TrainingNeedParts';
import { TniRequest, formatTniDate } from '../../data/clientTrainingNeedData';
import { Card, ChipRow, EmptyCard, FieldGrid, Pill, SearchField, TabTitle } from './StaffTabParts';

type TypeFilter = 'All' | TrainingType;

/** Desktop "Training & Development" tab (training_development.tpl): type filter + search, training list */
export const StaffTrainingTab: React.FC<{ trainings: TrainingRecord[]; tniRequests?: TniRequest[]; onOpenTrainingNeed?: () => void }> = ({
  trainings,
  tniRequests = [],
  onOpenTrainingNeed,
}) => {
  const [type, setType] = useState<TypeFilter>('All');
  const [query, setQuery] = useState('');

  const term = query.trim().toLowerCase();
  const byType = type === 'All' ? trainings : trainings.filter((t) => t.type === type);
  const visible = term ? byType.filter((t) => t.name.toLowerCase().includes(term)) : byType;
  const counts = Object.fromEntries([['All', trainings.length], ...TRAINING_TYPES.map((t) => [t, trainings.filter((r) => r.type === t).length])]);
  const filtered = type !== 'All' || term.length > 0;

  return (
    <>
      <TabTitle title="Training & Development" />
      <div className="mt-2.5 space-y-3">
        {tniRequests.length > 0 && (
          <Card className="p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#1D4ED8]">
                <ScanSearch className="w-4 h-4" />
                Training Need Identification
              </p>
              {onOpenTrainingNeed && (
                <button type="button" onClick={onOpenTrainingNeed} className="flex items-center text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                  View all
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <ul className="mt-2.5 space-y-2">
              {tniRequests.map((r) => (
                <li key={r.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-[#1E293B] truncate">{r.mainProgramme || r.trainingNames[0] || r.software[0] || 'TNI Request'}</span>
                    <span className="block text-[11px] text-slate-400 tabular-nums">Requested {formatTniDate(r.requestedOn)}</span>
                  </span>
                  <TniStatusPill status={r.status} />
                </li>
              ))}
            </ul>
          </Card>
        )}
        <SearchField value={query} onChange={setQuery} placeholder="Search training" />
        <ChipRow<TypeFilter> label="Training type" options={['All', ...TRAINING_TYPES]} value={type} onChange={setType} counts={counts} />

        {visible.length === 0 ? (
          <EmptyCard
            icon={BookOpen}
            title={trainings.length === 0 ? 'No trainings yet.' : 'No trainings match your search.'}
            text={trainings.length === 0 ? 'Trainings this staff takes will show up here.' : 'Try another type or name.'}
            action={
              filtered ? (
                <button
                  type="button"
                  onClick={() => {
                    setType('All');
                    setQuery('');
                  }}
                  className="mt-3 text-xs font-bold text-[#2F68FE] cursor-pointer"
                >
                  Clear All
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {visible.map((t) => (
              <li key={t.id}>
                <Card className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{t.name}</p>
                    <Pill tone={t.status === 'Completed' ? 'green' : t.status === 'In Progress' ? 'amber' : 'slate'}>{t.status}</Pill>
                  </div>
                  <FieldGrid
                    compact
                    fields={[
                      { label: 'Type', value: t.type },
                      { label: 'Duration', value: t.duration },
                      { label: 'Start Date', value: formatStaffDate(t.startDate) },
                    ]}
                  />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};
