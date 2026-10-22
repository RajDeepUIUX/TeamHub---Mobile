import React, { useEffect, useRef, useState } from 'react';
import { Check, Info, UsersRound } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SearchField, SheetHeader } from '../staff/tabs/StaffTabParts';
import {
  FlexKey,
  FlexTiming,
  WORK_FLEX_ITEMS,
  WORK_FLEX_TIMINGS,
  WorkFlexFlexState,
  WorkFlexStaff,
  YesNo,
} from '../data/clientWorkFlexData';
import { SelectAllButton, SheetFooter, StaffPickRow, WORK_FLEX_SAVE_MS } from './WorkFlexParts';

interface Props {
  isOpen: boolean;
  flexKey: FlexKey | null;
  current: WorkFlexFlexState | null;
  staff: WorkFlexStaff[];
  onClose: () => void;
  onSave: (key: FlexKey, next: WorkFlexFlexState) => void;
}

interface Draft {
  perStaff: Record<string, YesNo>;
  perStaffByTiming: Record<FlexTiming, Record<string, YesNo>>;
  timing: FlexTiming | null;
}

const matches = (s: WorkFlexStaff, q: string) =>
  !q || s.name.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q) || s.shift.toLowerCase().includes(q);

/** Desktop drawer "Configure — {Flexibility}": bulk default Allowed, override any staff; timing flexibilities pick when it applies first */
export const WorkFlexAllowSheet: React.FC<Props> = ({ isOpen, flexKey, current, staff, onClose, onSave }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !current) return;
    // Switching to Allowed sets every staff to allowed; editing keeps the saved per-staff values
    const perStaff: Record<string, YesNo> = {};
    staff.forEach((s) => {
      perStaff[s.id] = current.default === 'yes' ? current.perStaff[s.id] ?? 'yes' : 'yes';
    });
    setDraft({
      perStaff,
      perStaffByTiming: {
        round_year: { ...current.perStaffByTiming.round_year },
        seasonal: { ...current.perStaffByTiming.seasonal },
      },
      timing: current.timing,
    });
    setSearch('');
    setSaving(false);
  }, [isOpen, current, staff]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const item = WORK_FLEX_ITEMS.find((f) => f.key === flexKey);
  if (!item || !draft) return null;

  const needsTiming = item.needsTiming;
  const timing = draft.timing;
  const timingReady = !needsTiming || timing !== null;

  // Timing flexibilities: staff allowed in the other timing are locked here
  const otherTiming = WORK_FLEX_TIMINGS.find((t) => t.key !== timing);
  const lockedIds = new Set(
    needsTiming && timing && otherTiming
      ? Object.keys(draft.perStaffByTiming[otherTiming.key]).filter((id) => draft.perStaffByTiming[otherTiming.key][id] === 'yes')
      : [],
  );
  const currentMap = needsTiming && timing ? draft.perStaffByTiming[timing] : draft.perStaff;
  const isAllowed = (id: string) => !lockedIds.has(id) && currentMap[id] === 'yes';

  const q = search.trim().toLowerCase();
  const list = staff.filter((s) => matches(s, q));
  const allowed = staff.filter((s) => isAllowed(s.id)).length;
  const locked = staff.filter((s) => lockedIds.has(s.id)).length;
  const notAllowed = staff.length - allowed - locked;

  const timingCount = (t: FlexTiming) => staff.filter((s) => draft.perStaffByTiming[t][s.id] === 'yes').length;

  const setMany = (ids: string[], val: YesNo) =>
    setDraft((prev) => {
      if (!prev) return prev;
      if (needsTiming && prev.timing) {
        const t = prev.timing;
        const map = { ...prev.perStaffByTiming[t] };
        ids.forEach((id) => {
          if (!lockedIds.has(id)) map[id] = val;
        });
        return { ...prev, perStaffByTiming: { ...prev.perStaffByTiming, [t]: map } };
      }
      const map = { ...prev.perStaff };
      ids.forEach((id) => {
        map[id] = val;
      });
      return { ...prev, perStaff: map };
    });

  const shownIds = list.filter((s) => !lockedIds.has(s.id)).map((s) => s.id);

  const save = () => {
    if (!flexKey) return;
    setSaving(true);
    const next: WorkFlexFlexState = needsTiming
      ? { default: 'yes', timing: draft.timing, perStaff: {}, perStaffByTiming: draft.perStaffByTiming }
      : { default: 'yes', timing: null, perStaff: draft.perStaff, perStaffByTiming: { round_year: {}, seasonal: {} } };
    timer.current = setTimeout(() => onSave(flexKey, next), WORK_FLEX_SAVE_MS);
  };

  const hint = !timingReady
    ? 'Pick when this applies to continue'
    : `${allowed} allowed · ${notAllowed} not allowed${locked ? ` · ${locked} in ${otherTiming?.tag}` : ''}`;

  return (
    <BottomSheet isOpen={isOpen} onClose={saving ? () => undefined : onClose} maxHeight="max-h-[92%]">
      <SheetHeader title={`Configure — ${item.name}`} subtitle="Bulk default: Allowed. Override any staff below." onClose={saving ? () => undefined : onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="px-4 pt-3 space-y-3">
          <p className="flex gap-2 px-3 py-2.5 rounded-xl bg-[#F0F6FF] border border-[#DBEAFE] text-[11.5px] leading-relaxed text-[#1E40AF]">
            <Info className="w-4 h-4 shrink-0 mt-px" />
            <span>{item.desc}</span>
          </p>

          {needsTiming && (
            <section>
              <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#1E293B]">
                <span className="w-5 h-5 rounded-full bg-[#2F68FE] text-white text-[10.5px] font-bold flex items-center justify-center">1</span>
                When does this apply?
              </h3>
              <div role="radiogroup" aria-label="When does this apply" className="mt-2 grid grid-cols-2 gap-2">
                {WORK_FLEX_TIMINGS.map((t) => {
                  const on = timing === t.key;
                  const count = timingCount(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setDraft((prev) => (prev ? { ...prev, timing: t.key } : prev))}
                      className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        on ? 'border-[#2F68FE] bg-blue-50/50 ring-4 ring-blue-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span
                        className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          on ? 'border-[#2F68FE] bg-[#2F68FE] text-white' : 'border-slate-300'
                        }`}
                      >
                        {on && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold items-center">{t.tag}</span>
                      <span className="mt-1.5 block text-[12px] font-bold text-[#1E293B] leading-snug">{t.title}</span>
                      <span className="mt-0.5 block text-[10.5px] text-slate-500 leading-snug">{t.desc}</span>
                      <span className="mt-1.5 block text-[10.5px] font-semibold text-slate-400 tabular-nums">{count} allowed</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {!timingReady ? (
          <p className="px-6 py-10 text-center text-[13px] text-slate-400">Pick when this applies to continue.</p>
        ) : (
          <div className="px-4 pt-3 pb-4">
            {needsTiming && (
              <h3 className="mb-2 flex items-center gap-2 text-[13px] font-bold text-[#1E293B]">
                <span className="w-5 h-5 rounded-full bg-[#2F68FE] text-white text-[10.5px] font-bold flex items-center justify-center">2</span>
                Who is allowed?
              </h3>
            )}
            <div className="sticky top-0 z-10 -mx-4 px-4 pb-2 bg-white">
              <SearchField variant="sheet" value={search} onChange={setSearch} placeholder="Search by name, role, or shift…" />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <SelectAllButton label="Allow all" onClick={() => setMany(shownIds, 'yes')} disabled={shownIds.length === 0} />
                <SelectAllButton label="Disallow all" onClick={() => setMany(shownIds, 'no')} disabled={shownIds.length === 0} />
              </div>
            </div>

            {staff.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center">
                <span className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <UsersRound className="w-5 h-5" />
                </span>
                <p className="mt-3 text-sm font-bold text-[#1E293B]">No active staff yet</p>
              </div>
            ) : list.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-slate-400">No staff match “{search.trim()}”</p>
            ) : (
              <ul className="space-y-2">
                {list.map((s) => (
                  <StaffPickRow
                    key={s.id}
                    staff={s}
                    checked={isAllowed(s.id)}
                    onToggle={() => setMany([s.id], isAllowed(s.id) ? 'no' : 'yes')}
                    lockedNote={lockedIds.has(s.id) ? otherTiming?.tag : undefined}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <SheetFooter hint={hint} saving={saving} disabled={!timingReady} onCancel={onClose} onSave={save} />
    </BottomSheet>
  );
};
