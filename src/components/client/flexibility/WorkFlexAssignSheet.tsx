import React, { useEffect, useRef, useState } from 'react';
import { Info, UsersRound } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SearchField, SheetHeader } from '../staff/tabs/StaffTabParts';
import {
  ArrangementKey,
  ArrangementStaff,
  FlexModeKey,
  HybridSplit,
  WORK_FLEX_ARRANGEMENTS,
  WORK_FLEX_MODES,
  WorkFlexModeState,
  WorkFlexStaff,
} from '../data/clientWorkFlexData';
import { SelectAllButton, SheetFooter, StaffPickRow, WORK_FLEX_SAVE_MS } from './WorkFlexParts';

export interface AssignTarget {
  mode: FlexModeKey;
  arrangement: ArrangementKey;
}

interface Props {
  isOpen: boolean;
  target: AssignTarget | null;
  modeState: WorkFlexModeState | null;
  staff: WorkFlexStaff[];
  onClose: () => void;
  onSave: (target: AssignTarget, assigned: ArrangementStaff) => void;
}

const SPLITS: { key: HybridSplit; label: string }[] = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
];

const matches = (s: WorkFlexStaff, q: string) =>
  !q || s.name.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q);

/** Desktop drawer "{Arrangement} — {Mode}": tick staff; Hybrid also sets each one's office / home split */
export const WorkFlexAssignSheet: React.FC<Props> = ({ isOpen, target, modeState, staff, onClose, onSave }) => {
  const [draft, setDraft] = useState<ArrangementStaff>({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !target || !modeState) return;
    setDraft({ ...modeState.arrangements[target.arrangement] });
    setSearch('');
    setSaving(false);
  }, [isOpen, target, modeState]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!target || !modeState) return null;

  const mode = WORK_FLEX_MODES.find((m) => m.key === target.mode)!;
  const arrangement = WORK_FLEX_ARRANGEMENTS.find((a) => a.key === target.arrangement)!;
  const isHybrid = target.mode === 'hyb';

  // A staff member can be in one arrangement per mode
  const lockedIn: Record<string, string> = {};
  WORK_FLEX_ARRANGEMENTS.forEach((a) => {
    if (a.key === target.arrangement) return;
    Object.keys(modeState.arrangements[a.key]).forEach((id) => {
      lockedIn[id] = a.name;
    });
  });

  const q = search.trim().toLowerCase();
  const list = staff.filter((s) => matches(s, q));
  const selectable = list.filter((s) => !lockedIn[s.id]);
  const allTicked = selectable.length > 0 && selectable.every((s) => draft[s.id] != null);
  const assignedCount = Object.keys(draft).length;

  const toggle = (id: string) =>
    setDraft((prev) => {
      const next = { ...prev };
      if (next[id] != null) delete next[id];
      else next[id] = isHybrid ? 'days' : true;
      return next;
    });

  const toggleAll = () =>
    setDraft((prev) => {
      const next = { ...prev };
      selectable.forEach((s) => {
        if (allTicked) delete next[s.id];
        else if (next[s.id] == null) next[s.id] = isHybrid ? 'days' : true;
      });
      return next;
    });

  const save = () => {
    setSaving(true);
    timer.current = setTimeout(() => onSave(target, draft), WORK_FLEX_SAVE_MS);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={saving ? () => undefined : onClose} maxHeight="max-h-[92%]">
      <SheetHeader
        title={`${arrangement.name} — ${mode.title}`}
        subtitle={isHybrid ? 'Assign staff, and set each one’s office / home split.' : 'Assign the staff this arrangement applies to.'}
        onClose={saving ? () => undefined : onClose}
      />

      <div className="px-4 pt-3 pb-2 shrink-0 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <SearchField variant="sheet" value={search} onChange={setSearch} placeholder="Search by name or role…" />
          </div>
          <SelectAllButton label={allTicked ? 'Clear all' : 'Select all'} onClick={toggleAll} disabled={selectable.length === 0} />
        </div>
        {isHybrid && (
          <p className="flex gap-2 px-3 py-2.5 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] text-[11px] leading-relaxed text-[#3730A3]">
            <Info className="w-4 h-4 shrink-0 mt-px" />
            <span>
              <strong>Office / Home split</strong> — <strong>Days:</strong> some days in office, some from home · <strong>Hours:</strong> part of
              each day in office, part from home.
            </span>
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-4">
        {staff.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-center">
            <span className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <UsersRound className="w-5 h-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">No active staff yet</p>
            <p className="mt-1 text-xs text-slate-500">Hired staff will show up here.</p>
          </div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-slate-400">No staff match “{search.trim()}”</p>
        ) : (
          <ul className="space-y-2">
            {list.map((s) => {
              const split = draft[s.id];
              const on = split != null;
              return (
                <StaffPickRow
                  key={s.id}
                  staff={s}
                  checked={on}
                  onToggle={() => toggle(s.id)}
                  lockedNote={lockedIn[s.id] ? `In ${lockedIn[s.id]}` : undefined}
                >
                  {isHybrid && on && (
                    <div className="px-3 pb-3 -mt-0.5 flex items-center gap-2">
                      <span className="text-[10.5px] font-semibold text-slate-500">Office / Home split</span>
                      <div role="group" aria-label={`Split for ${s.name}`} className="ml-auto grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-white border border-[#BFDBFE]">
                        {SPLITS.map((o) => (
                          <button
                            key={o.key}
                            type="button"
                            aria-pressed={split === o.key}
                            onClick={() => setDraft((prev) => ({ ...prev, [s.id]: o.key }))}
                            className={`h-7 px-3 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                              split === o.key ? 'bg-[#2F68FE] text-white' : 'text-slate-500 active:bg-slate-100'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </StaffPickRow>
              );
            })}
          </ul>
        )}
      </div>

      <SheetFooter
        hint={`${assignedCount} staff assigned to this arrangement`}
        saving={saving}
        onCancel={onClose}
        onSave={save}
      />
    </BottomSheet>
  );
};
