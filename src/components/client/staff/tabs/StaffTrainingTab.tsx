import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, ScanSearch } from 'lucide-react';
import { formatStaffDate } from '../../data/clientStaffData';
import { TRAINING_TYPES, TrainingRecord, TrainingType } from '../../data/clientStaffProfileData';
import { TniStatusPill } from '../../training/TrainingNeedParts';
import { TniRequest, formatTniDate } from '../../data/clientTrainingNeedData';
import { BottomSheet } from '../../../common/BottomSheet';
import { ChoiceTiles } from '../../../common/ChoiceTiles';
import { FilterIconButton } from '../../../common/TeamFilterSheet';
import { ACCENT, AccentCard, Card, CardHeading, EmptyCard, Pill, SearchField, SheetHeader, Tone } from './StaffTabParts';

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
          <Card className="p-4">
            <CardHeading
              icon={ScanSearch}
              title="Training Need Identification"
              trailing={
                onOpenTrainingNeed && (
                  <button
                    type="button"
                    onClick={onOpenTrainingNeed}
                    className="h-8 pl-3 pr-2 rounded-full bg-[#EEF2FF] text-[11px] font-bold text-[#2F68FE] flex items-center active:bg-[#E0E7FF] cursor-pointer"
                  >
                    View all
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )
              }
            />
            <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
              {tniRequests.map((r) => (
                <li key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[#1E293B] truncate">{r.mainProgramme || r.trainingNames[0] || r.software[0] || 'TNI Request'}</span>
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
            {visible.map((t) => {
              const tone: Tone = t.status === 'Completed' ? 'green' : t.status === 'In Progress' ? 'indigo' : 'amber';
              // Status | Type, then Duration | Start Date (50 / 50)
              const fields: [string, React.ReactNode][] = [
                ['Status', <Pill tone={tone}>{t.status}</Pill>],
                ['Type', t.type],
                ['Duration', t.duration],
                ['Start Date', formatStaffDate(t.startDate)],
              ];
              const grid = (
                <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {fields.map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-[11px] text-slate-400">{label}</dt>
                      <dd className="mt-0.5 text-xs font-semibold text-[#1E293B] leading-snug break-words tabular-nums">{value || '--'}</dd>
                    </div>
                  ))}
                </dl>
              );
              return (
                <li key={t.id}>
                  <AccentCard accent={ACCENT[tone]} className="pl-4 pr-3.5 py-3.5">
                    <p className="text-[11px] text-slate-400">Training Name</p>
                    <p className="text-sm font-bold text-[#1E293B] leading-snug">{t.name}</p>
                    <div className="mt-3 pt-0.5 border-t border-slate-100">{grid}</div>
                  </AccentCard>
                </li>
              );
            })}
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
