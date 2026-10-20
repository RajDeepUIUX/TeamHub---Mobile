import React, { useEffect, useState } from 'react';
import { CalendarDays, Check, Info, Minus, X } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { DatePickerSheet } from '../common/DatePickerSheet';
import { toDateKey } from '../../design-system/components/RangeCalendar';
import { TEAM_OUTING_MEMBERS, TeamOutingDetails } from '../../data/reimbursementData';

/** 13-10-2026, as on the web */
export const formatOutingDate = (iso: string) => iso.split('-').reverse().join('-');

const Tick: React.FC<{ state: 'on' | 'off' | 'some' }> = ({ state }) => (
  <span
    aria-hidden="true"
    className={`w-4.5 h-4.5 rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-colors ${
      state !== 'off' ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
    }`}
  >
    {state === 'on' && <Check className="w-3 h-3 stroke-[3.5]" />}
    {state === 'some' && <Minus className="w-3 h-3 stroke-[3.5]" />}
  </span>
);

/* ------------------------------ Team Outing ------------------------------ */

export const TeamOutingSheet: React.FC<{
  isOpen: boolean;
  initial?: TeamOutingDetails;
  onClose: () => void;
  onSubmit: (details: TeamOutingDetails) => void;
}> = ({ isOpen, initial, onClose, onSubmit }) => {
  const [date, setDate] = useState(toDateKey(new Date()));
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [isDateOpen, setIsDateOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(initial?.date ?? toDateKey(new Date()));
      setPicked(new Set(initial?.employees ?? []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggle = (name: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  const allOn = picked.size === TEAM_OUTING_MEMBERS.length;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <h2 className="text-base font-bold text-[#1E293B]">Team Outing</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        {/* Expense date */}
        <div>
          <span className="block text-xs font-semibold text-[#1E293B] mb-1.5">
            Please Select Expense Date<span className="text-rose-500"> *</span>
          </span>
          <button
            type="button"
            onClick={() => setIsDateOpen(true)}
            className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs shadow-2xs active:bg-slate-50 cursor-pointer"
          >
            <CalendarDays className="w-4 h-4 text-[#2F68FE] shrink-0" />
            <span className="flex-1 text-left font-semibold text-[#1E293B] tabular-nums">{formatOutingDate(date)}</span>
          </button>
        </div>

        {/* Employees */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              Select Employees
              <Info className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </p>
            {/* One control: ticks everyone, or clears everyone when all are ticked */}
            <button
              type="button"
              role="checkbox"
              aria-checked={allOn ? true : picked.size ? 'mixed' : false}
              onClick={() => setPicked(allOn ? new Set() : new Set(TEAM_OUTING_MEMBERS.map((m) => m.name)))}
              className="h-8 -mr-1 px-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
            >
              <Tick state={allOn ? 'on' : picked.size ? 'some' : 'off'} />
              Select All
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">Once Submitted you won't be able to revert the submitted data.</p>

          <ul className="mt-3 space-y-2">
            {TEAM_OUTING_MEMBERS.map((m) => {
              const on = picked.has(m.name);
              return (
                <li key={m.name}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(m.name)}
                    className={`w-full px-3 py-2.5 rounded-xl border flex items-start gap-2.5 text-left transition-colors cursor-pointer ${
                      on ? 'border-blue-200 bg-[#F5F8FF] active:bg-[#EEF4FF]' : 'border-slate-200 bg-white active:bg-slate-50'
                    }`}
                  >
                    <span className="mt-px">
                      <Tick state={on ? 'on' : 'off'} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-[#1E293B] truncate">{m.name}</span>
                      <span className="block mt-0.5 text-[11px] text-slate-500 tabular-nums">
                        Available Budget : Rs.{m.budget.toFixed(2)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          disabled={picked.size === 0}
          onClick={() => onSubmit({ date, employees: TEAM_OUTING_MEMBERS.map((m) => m.name).filter((n) => picked.has(n)) })}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>

      <DatePickerSheet
        isOpen={isDateOpen}
        mode="single"
        title="Expense Date"
        start={date}
        onClose={() => setIsDateOpen(false)}
        onApply={(d) => {
          if (d) setDate(d);
          setIsDateOpen(false);
        }}
      />
    </BottomSheet>
  );
};

/* ------------------------------ Attention ------------------------------ */

export const SubmitAttentionSheet: React.FC<{ isOpen: boolean; onEdit: () => void; onSubmit: () => void }> = ({
  isOpen,
  onEdit,
  onSubmit,
}) => (
  <BottomSheet isOpen={isOpen} onClose={onEdit} maxHeight="max-h-[60%]">
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
      <h2 className="text-base font-bold text-[#1E293B]">Attention</h2>
      <button
        type="button"
        onClick={onEdit}
        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
    <p className="px-5 py-4 text-xs text-slate-600 leading-relaxed">
      Submitted information is final and cannot be edited. Ensure accuracy before proceeding.
    </p>
    <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
      <button
        type="button"
        onClick={onEdit}
        className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
      >
        Submit
      </button>
    </div>
  </BottomSheet>
);
