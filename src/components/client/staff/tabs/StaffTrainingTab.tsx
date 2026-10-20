import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, ScanSearch } from 'lucide-react';
import { formatStaffDate } from '../../data/clientStaffData';
import { TRAINING_TYPES, TrainingRecord, TrainingType } from '../../data/clientStaffProfileData';
import { TniStatusPill } from '../../training/TrainingNeedParts';
import { TniRequest, formatTniDate } from '../../data/clientTrainingNeedData';
import { BottomSheet } from '../../../common/BottomSheet';
import { ChoiceTiles } from '../../../common/ChoiceTiles';
import { FilterIconButton } from '../../../common/TeamFilterSheet';
import { Card, EmptyCard, FieldGrid, Pill, SearchField, SheetHeader } from './StaffTabParts';

type TypeFilter = 'All' | TrainingType;

/** Desktop "Select Type" dropdown as a sheet, with the same Clear All / Search actions */
const TrainingFilterSheet: React.FC<{
  isOpen: boolean;
  type: TypeFilter;
  counts: Record<string, number>;
  onClose: () => void;
  onApply: (type: TypeFilter) => void;
  onClear: () => void;
}> = ({ isOpen, type, counts, onClose, onApply, onClear }) => {
  const [draft, setDraft] = useState<TypeFilter>(type);

  useEffect(() => {
    if (isOpen) setDraft(type);
  }, [isOpen, type]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Filter Trainings" subtitle="Pick a type, then tap Search" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-2">
        <span className="text-xs font-bold text-[#1E293B]">Type</span>
        <ChoiceTiles
          multiple={false}
          options={(['All', ...TRAINING_TYPES] as TypeFilter[]).map((t) => `${t} (${counts[t] ?? 0})`)}
          selected={[`${draft} (${counts[draft] ?? 0})`]}
          onChange={(v) => setDraft(((v[0] ?? 'All').replace(/ \(\d+\)$/, '') as TypeFilter))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClear}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Search
        </button>
      </div>
    </BottomSheet>
  );
};

/** Desktop "Training & Development" tab (training_development.tpl): type filter + search, training list */
export const StaffTrainingTab: React.FC<{ trainings: TrainingRecord[]; tniRequests?: TniRequest[]; onOpenTrainingNeed?: () => void }> = ({
  trainings,
  tniRequests = [],
  onOpenTrainingNeed,
}) => {
  const [type, setType] = useState<TypeFilter>('All');
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const term = query.trim().toLowerCase();
  const byType = type === 'All' ? trainings : trainings.filter((t) => t.type === type);
  const visible = term ? byType.filter((t) => t.name.toLowerCase().includes(term)) : byType;
  const counts = Object.fromEntries([['All', trainings.length], ...TRAINING_TYPES.map((t) => [t, trainings.filter((r) => r.type === t).length])]);
  const filtered = type !== 'All' || term.length > 0;

  return (
    <>
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
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <SearchField value={query} onChange={setQuery} placeholder="Search By Name" />
          </div>
          <FilterIconButton count={type === 'All' ? 0 : 1} onClick={() => setFilterOpen(true)} label="Filter trainings" />
        </div>
        {visible.length > 0 && (
          <p className="px-1 text-[11.5px] font-medium text-slate-500">
            Showing <span className="font-bold text-[#1E293B] tabular-nums">{visible.length}</span> Of{' '}
            <span className="font-bold text-[#1E293B] tabular-nums">{trainings.length}</span> Records
            {type !== 'All' && <span className="text-[#2F68FE] font-semibold"> · {type}</span>}
          </p>
        )}

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
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10.5px] text-slate-400">Training Name</p>
                      <p className="mt-0.5 text-[13px] font-bold text-[#1E293B] leading-snug">{t.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10.5px] text-slate-400">Status</p>
                      <div className="mt-0.5">
                        <Pill tone={t.status === 'Completed' ? 'green' : t.status === 'In Progress' ? 'indigo' : 'amber'}>{t.status}</Pill>
                      </div>
                    </div>
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

      <TrainingFilterSheet
        isOpen={filterOpen}
        type={type}
        counts={counts}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setType(next);
          setFilterOpen(false);
        }}
        onClear={() => {
          setType('All');
          setQuery('');
          setFilterOpen(false);
        }}
      />
    </>
  );
};
