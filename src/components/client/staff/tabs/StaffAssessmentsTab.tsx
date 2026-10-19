import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import { formatStaffDate } from '../../data/clientStaffData';
import type { AssessmentRecord } from '../../data/clientStaffProfileData';
import { Card, ChipRow, EmptyCard, FieldGrid, Pill, SearchField, SheetHeader, TabTitle, Tone } from './StaffTabParts';

const scoreTone = (score: number): Tone => (score >= 80 ? 'green' : score >= 60 ? 'blue' : 'rose');

/** Desktop "Assessments" tab (assessments_tab.tpl): assessment-name filter + search, results list */
export const StaffAssessmentsTab: React.FC<{ assessments: AssessmentRecord[]; staffName: string }> = ({ assessments, staffName }) => {
  const names = ['All', ...Array.from(new Set(assessments.map((a) => a.name)))];
  const [name, setName] = useState('All');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<AssessmentRecord | null>(null);

  const term = query.trim().toLowerCase();
  const visible = assessments.filter((a) => (name === 'All' || a.name === name) && (!term || a.name.toLowerCase().includes(term) || a.assignedBy.toLowerCase().includes(term)));
  const filtered = name !== 'All' || term.length > 0;

  return (
    <>
      <TabTitle title="Assessments" />
      <div className="mt-2.5 space-y-3">
        <SearchField value={query} onChange={setQuery} placeholder="Search assessment" />
        <ChipRow label="Assessment name" options={names} value={name} onChange={setName} />

        {visible.length === 0 ? (
          <EmptyCard
            icon={ClipboardCheck}
            title={assessments.length === 0 ? 'No assessments assigned.' : 'No assessments match your search.'}
            action={
              filtered ? (
                <button
                  type="button"
                  onClick={() => {
                    setName('All');
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
            {visible.map((a) => (
              <li key={a.id}>
                <Card className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{a.name}</p>
                    {a.score === null ? <Pill tone="amber">Pending</Pill> : <Pill tone={scoreTone(a.score)}>{a.score}%</Pill>}
                  </div>
                  <FieldGrid
                    compact
                    fields={[
                      { label: 'Assigned By', value: a.assignedBy },
                      { label: 'Assigned On', value: formatStaffDate(a.assignedOn) },
                      { label: 'Completed On', value: a.completedOn ? formatStaffDate(a.completedOn) : '--' },
                    ]}
                  />
                  <button
                    type="button"
                    disabled={a.score === null}
                    onClick={() => setOpen(a)}
                    className="mt-3 w-full h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-[11.5px] font-bold active:bg-[#E0E7FF] disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {a.score === null ? 'Result available after completion' : 'View Result'}
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomSheet isOpen={open !== null} onClose={() => setOpen(null)} maxHeight="max-h-[70%]">
        <SheetHeader title={open?.name ?? ''} subtitle={staffName} onClose={() => setOpen(null)} />
        {open && open.score !== null && (
          <div className="px-5 py-5">
            <div className="flex flex-col items-center">
              <span
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ background: `conic-gradient(#2F68FE ${open.score * 3.6}deg, #E2E8F0 0deg)` }}
              >
                <span className="w-22 h-22 rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-[#1E293B] tabular-nums leading-none">{open.score}%</span>
                  <span className="mt-1 text-[10px] font-semibold text-slate-400">Score</span>
                </span>
              </span>
              <span className="mt-3">
                <Pill tone={scoreTone(open.score)}>{open.score >= 80 ? 'Excellent' : open.score >= 60 ? 'Good' : 'Needs improvement'}</Pill>
              </span>
            </div>
            <FieldGrid
              fields={[
                { label: 'Assigned By', value: open.assignedBy },
                { label: 'Assigned On', value: formatStaffDate(open.assignedOn) },
                { label: 'Completed On', value: open.completedOn ? formatStaffDate(open.completedOn) : '--' },
              ]}
            />
          </div>
        )}
        <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
          <button type="button" onClick={() => setOpen(null)} className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
            Done
          </button>
        </div>
      </BottomSheet>
    </>
  );
};
