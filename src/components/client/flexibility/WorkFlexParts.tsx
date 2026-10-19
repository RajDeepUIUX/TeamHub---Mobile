import React from 'react';
import { Check, Clock, Loader2, Lock, X } from 'lucide-react';
import { StaffAvatar } from '../staff/ClientStaffParts';
import type { WorkFlexStaff, YesNo } from '../data/clientWorkFlexData';
import { WORK_FLEX_CLIENT_TZ } from '../data/clientWorkFlexData';

/** Desktop "Allowed / Not Allowed" → Staff My Profile Yes / No radio tiles. Sliding pill; tapping the active side clears it */
export const AllowToggle: React.FC<{
  value: YesNo | null;
  onChange: (v: YesNo) => void;
  label: string;
  disabled?: boolean;
  compact?: boolean;
}> = ({ value, onChange, label, disabled, compact }) => (
  <div role="radiogroup" aria-label={label} className={`relative grid grid-cols-2 p-1 rounded-2xl bg-slate-100 ${disabled ? 'opacity-60' : ''}`}>
    <span
      aria-hidden="true"
      className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl shadow-[0_2px_8px_rgba(15,23,42,0.18)] transition-all duration-300 ease-out ${
        value === null ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
      } ${value === 'no' ? 'translate-x-full bg-[#64748B]' : 'bg-[#10B981]'}`}
    />
    {(['yes', 'no'] as const).map((v) => {
      const on = value === v;
      const yes = v === 'yes';
      return (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={on}
          disabled={disabled}
          onClick={() => onChange(v)}
          className={`relative z-10 ${compact ? 'h-9' : 'h-11'} rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-bold transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
            on ? 'text-white' : 'text-slate-500 active:text-slate-700'
          }`}
        >
          {yes ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
          {yes ? 'Allowed' : 'Not Allowed'}
        </button>
      );
    })}
  </div>
);

/** Staff row in the assign / allow sheets: avatar, name, designation, shift (client TZ), checkbox */
export const StaffPickRow: React.FC<{
  staff: WorkFlexStaff;
  checked: boolean;
  onToggle: () => void;
  lockedNote?: string;
  children?: React.ReactNode;
}> = ({ staff, checked, onToggle, lockedNote, children }) => {
  const locked = Boolean(lockedNote);
  return (
    <li
      className={`rounded-2xl border transition-colors ${
        locked ? 'border-slate-100 bg-slate-50' : checked ? 'border-[#BFDBFE] bg-[#EFF6FF]' : 'border-[#EBF0F7] bg-white'
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-disabled={locked}
        disabled={locked}
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 text-left cursor-pointer disabled:cursor-not-allowed"
      >
        <span className={locked ? 'grayscale opacity-60' : ''}>
          <StaffAvatar name={staff.name} tint={staff.tint} />
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block text-[13px] font-bold truncate ${locked ? 'text-slate-400' : 'text-[#1E293B]'}`}>{staff.name}</span>
          <span className="block text-[11px] text-slate-500 truncate">{staff.designation}</span>
          <span className="mt-0.5 flex items-center gap-1 text-[10.5px] text-slate-400 tabular-nums">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {staff.shift} ({WORK_FLEX_CLIENT_TZ})
            </span>
          </span>
        </span>
        {locked ? (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/70 text-[10px] font-bold text-slate-500">
            <Lock className="w-3 h-3" />
            {lockedNote}
          </span>
        ) : (
          <span
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
              checked ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
            }`}
            aria-hidden="true"
          >
            {checked && <Check className="w-3 h-3 stroke-[3]" />}
          </span>
        )}
      </button>
      {children}
    </li>
  );
};

export const SheetFooter: React.FC<{
  hint: string;
  saving: boolean;
  disabled?: boolean;
  saveLabel?: string;
  onCancel: () => void;
  onSave: () => void;
}> = ({ hint, saving, disabled, saveLabel = 'Save', onCancel, onSave }) => (
  <div className="px-4 pt-2.5 pb-6 border-t border-slate-100 shrink-0 bg-white">
    <p className="mb-2 text-center text-[11px] font-semibold text-slate-500 tabular-nums" aria-live="polite">
      {hint}
    </p>
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || disabled}
        className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? 'Saving…' : saveLabel}
      </button>
    </div>
  </div>
);

export const SelectAllButton: React.FC<{ label: string; onClick: () => void; disabled?: boolean }> = ({ label, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="shrink-0 h-11 px-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[11.5px] font-bold text-[#2F68FE] active:bg-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {label}
  </button>
);

/** Mock save delay (desktop shows "Saving…" while the AJAX call runs) */
export const WORK_FLEX_SAVE_MS = 700;
