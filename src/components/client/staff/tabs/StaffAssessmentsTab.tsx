import React, { useEffect, useState } from 'react';
import { ClipboardCheck, FileDown } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import { ChoiceTiles } from '../../../common/ChoiceTiles';
import { FilterIconButton } from '../../../common/TeamFilterSheet';
import { formatStaffDate } from '../../data/clientStaffData';
import { AssessmentRecord, assessmentScore } from '../../data/clientStaffProfileData';
import { Card, DateField, EmptyCard, FieldGrid, RowList, SheetHeader } from './StaffTabParts';

const ALL = 'All';

interface AssessmentFilters {
  name: string;
  assignedOn: string;
  completedOn: string;
}

const EMPTY_FILTERS: AssessmentFilters = { name: ALL, assignedOn: '', completedOn: '' };

/** Desktop filter row (Assessment Name dropdown, Assigned On, Completed On) as a sheet with Clear All / Search */
const AssessmentFilterSheet: React.FC<{
  isOpen: boolean;
  names: string[];
  filters: AssessmentFilters;
  onClose: () => void;
  onApply: (f: AssessmentFilters) => void;
  onClear: () => void;
}> = ({ isOpen, names, filters, onClose, onApply, onClear }) => {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Filter Assessments" subtitle="Pick filters, then tap Search" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-5">
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#1E293B]">Assessment Name</span>
          <ChoiceTiles multiple={false} options={[ALL, ...names]} selected={[draft.name]} onChange={(v) => setDraft((d) => ({ ...d, name: v[0] ?? ALL }))} />
        </div>
        <DateField label="Assigned On" value={draft.assignedOn} onChange={(iso) => setDraft((d) => ({ ...d, assignedOn: iso }))} />
        <DateField label="Completed On" value={draft.completedOn} onChange={(iso) => setDraft((d) => ({ ...d, completedOn: iso }))} />
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

/** Desktop "Assessments" tab (assessments_tab.tpl + projects::assessments_list): name / assigned on / completed on filters, results table */
export const StaffAssessmentsTab: React.FC<{ assessments: AssessmentRecord[]; v2?: boolean }> = ({ assessments, v2 }) => {
  const names = Array.from(new Set(assessments.map((a) => a.name)));
  const [filters, setFilters] = useState<AssessmentFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const visible = assessments.filter(
    (a) =>
      (filters.name === ALL || a.name === filters.name) &&
      (!filters.assignedOn || a.assignedOn === filters.assignedOn) &&
      (!filters.completedOn || a.completedOn === filters.completedOn),
  );
  const filterCount = (filters.name === ALL ? 0 : 1) + (filters.assignedOn ? 1 : 0) + (filters.completedOn ? 1 : 0);
  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setFilterOpen(false);
  };

  return (
    <>
      <div className="mt-2.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="px-1 text-[11.5px] font-medium text-slate-500">
            Showing <span className="font-bold text-[#1E293B] tabular-nums">{visible.length}</span> Of{' '}
            <span className="font-bold text-[#1E293B] tabular-nums">{visible.length}</span> Records
          </p>
          <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} label="Filter assessments" />
        </div>

        {visible.length === 0 ? (
          <EmptyCard
            icon={ClipboardCheck}
            title="No Data Found"
            action={
              filterCount > 0 ? (
                <button type="button" onClick={clearAll} className="mt-3 text-xs font-bold text-[#2F68FE] cursor-pointer">
                  Clear All
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {visible.map((a) =>
              v2 ? (
                <li key={a.id}>
                  <Card className="overflow-hidden">
                    <div className="px-4 pt-4 pb-3 flex items-center gap-3.5 bg-linear-to-r from-[#F3F6FF] to-white">
                      <span className="w-14 h-14 rounded-full bg-white ring-4 ring-[#E0E7FF] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-slate-400 leading-none">Score</span>
                        <span className="mt-0.5 text-[13px] font-extrabold text-[#2F68FE] leading-none tabular-nums">{assessmentScore(a)}</span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10.5px] text-slate-400">Assessment Name</p>
                        <p className="text-[13.5px] font-bold text-[#1E293B] leading-snug">{a.name}</p>
                      </div>
                    </div>
                    <RowList
                      className="px-4 border-t border-slate-100"
                      rows={[
                        { label: 'Assigned By', value: a.assignedBy ?? '-' },
                        { label: 'Assigned On', value: formatStaffDate(a.assignedOn) },
                        { label: 'Completed On', value: a.completedOn ? formatStaffDate(a.completedOn) : '-' },
                        { label: 'Action', value: a.reportUrl ? null : '-' },
                      ]}
                    />
                    {a.reportUrl && (
                      <a
                        href={a.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download ${a.name} report`}
                        className="h-11 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-bold text-[#2F68FE] active:bg-[#F5F8FF]"
                      >
                        <FileDown className="w-4 h-4" /> Download Report
                      </a>
                    )}
                  </Card>
                </li>
              ) : (
              <li key={a.id}>
                <Card className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10.5px] text-slate-400">Assessment Name</p>
                      <p className="mt-0.5 text-[13px] font-bold text-[#1E293B] leading-snug">{a.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10.5px] text-slate-400">Score</p>
                      <p className="mt-0.5 text-[13px] font-bold text-[#1E293B] tabular-nums">{assessmentScore(a)}</p>
                    </div>
                  </div>
                  <FieldGrid
                    compact
                    fields={[
                      { label: 'Assigned By', value: a.assignedBy ?? '-', wide: true },
                      { label: 'Assigned On', value: formatStaffDate(a.assignedOn) },
                      { label: 'Completed On', value: a.completedOn ? formatStaffDate(a.completedOn) : '-' },
                    ]}
                  />
                  <p className="mt-2.5 text-[10.5px] text-slate-400">Action</p>
                  {a.reportUrl ? (
                    <a
                      href={a.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Download ${a.name} report`}
                      className="mt-1 w-9 h-9 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center active:bg-slate-50"
                    >
                      <FileDown className="w-4 h-4" />
                    </a>
                  ) : (
                    <p className="mt-0.5 text-[12px] font-semibold text-[#1E293B]">-</p>
                  )}
                </Card>
              </li>
              ),
            )}
          </ul>
        )}
      </div>

      <AssessmentFilterSheet
        isOpen={filterOpen}
        names={names}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
        }}
        onClear={clearAll}
      />
    </>
  );
};
