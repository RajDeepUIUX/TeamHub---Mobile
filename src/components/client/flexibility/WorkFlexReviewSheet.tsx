import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { Pill, SheetHeader } from '../staff/tabs/StaffTabParts';
import {
  WORK_FLEX_ARRANGEMENTS,
  WORK_FLEX_ITEMS,
  WORK_FLEX_MODES,
  WORK_FLEX_TIMINGS,
  WorkFlexPreferences,
  WorkFlexStaff,
  YesNo,
  flexCounts,
  modeStaffCount,
} from '../data/clientWorkFlexData';
import { SheetFooter, WORK_FLEX_SAVE_MS } from './WorkFlexParts';

interface Props {
  isOpen: boolean;
  prefs: WorkFlexPreferences;
  staff: WorkFlexStaff[];
  onClose: () => void;
  onConfirm: () => void;
}

const Status: React.FC<{ value: YesNo | null }> = ({ value }) =>
  value === 'yes' ? <Pill tone="green">Allowed</Pill> : value === 'no' ? <Pill tone="rose">Not Allowed</Pill> : <Pill tone="amber">Not answered</Pill>;

/** Human-readable summary before the full submit (Added by designer — desktop posts straight away) */
export const WorkFlexReviewSheet: React.FC<Props> = ({ isOpen, prefs, staff, onClose, onConfirm }) => {
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isOpen) setSaving(false);
  }, [isOpen]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const unanswered =
    WORK_FLEX_MODES.filter((m) => prefs.modes[m.key].offer === null).length +
    WORK_FLEX_ITEMS.filter((f) => prefs.flex[f.key].default === null).length;

  const submit = () => {
    setSaving(true);
    timer.current = setTimeout(onConfirm, WORK_FLEX_SAVE_MS);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={saving ? () => undefined : onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Review your preferences" subtitle="Check everything before you submit." onClose={saving ? () => undefined : onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3 space-y-3">
        <section>
          <h3 className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Work modes</h3>
          <ul className="mt-1.5 rounded-2xl border border-[#DCE3ED] divide-y divide-slate-100">
            {WORK_FLEX_MODES.map((m) => {
              const s = prefs.modes[m.key];
              const parts = WORK_FLEX_ARRANGEMENTS.map((a) => ({ name: a.name, n: Object.keys(s.arrangements[a.key]).length })).filter((p) => p.n > 0);
              return (
                <li key={m.key} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-[#1E293B]">{m.title}</span>
                    <Status value={s.offer} />
                  </div>
                  {s.offer === 'yes' && (
                    <p className="mt-1 text-[11.5px] text-slate-500">
                      {parts.length === 0
                        ? 'No staff assigned yet'
                        : `${modeStaffCount(s)} staff · ${parts.map((p) => `${p.name} ${p.n}`).join(' · ')}`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3 className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Additional flexibilities</h3>
          <ul className="mt-1.5 rounded-2xl border border-[#DCE3ED] divide-y divide-slate-100">
            {WORK_FLEX_ITEMS.map((f) => {
              const c = prefs.flex[f.key];
              const counts = flexCounts(f, c, staff);
              return (
                <li key={f.key} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-[#1E293B]">{f.name}</span>
                    <Status value={c.default} />
                  </div>
                  {c.default === 'yes' && (
                    <p className="mt-1 text-[11.5px] text-slate-500 tabular-nums">
                      {counts.byTiming
                        ? WORK_FLEX_TIMINGS.map((t) => `${t.tag} ${counts.byTiming![t.key]}`).join(' · ') + ` · ${counts.notAllowed} not allowed`
                        : `${counts.allowed} allowed · ${counts.notAllowed} not allowed`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {unanswered > 0 && (
          <p className="flex gap-2 px-3 py-2.5 rounded-xl bg-[#FEF8E7] border border-[#FDE68A] text-[11.5px] text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
            {unanswered} {unanswered === 1 ? 'item is' : 'items are'} not answered and will stay unchanged.
          </p>
        )}
        {prefs.savedAt && (
          <p className="px-1 text-[11px] text-slate-500">Any pending staff requests outside the new bounds may need re-approval.</p>
        )}
      </div>
      <SheetFooter hint="We’ll always talk to you before acting on these." saving={saving} saveLabel="Confirm & Submit" onCancel={onClose} onSave={submit} />
    </BottomSheet>
  );
};
