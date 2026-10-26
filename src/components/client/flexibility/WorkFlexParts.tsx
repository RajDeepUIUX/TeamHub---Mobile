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
  <div
    role="radiogroup"
    aria-label={label}
    className={`relative grid grid-cols-2 p-[3px] rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] ${disabled ? 'opacity-60' : ''}`}
  >
    <span
      aria-hidden="true"
      className={`absolute top-[3px] bottom-[3px] left-[3px] w-[calc(50%-3px)] rounded-lg transition-all duration-300 ease-out ${
        value === null ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
      } ${
        value === 'no'
          ? 'translate-x-full bg-gradient-to-r from-[#64748B] to-[#94A3B8] shadow-[0_2px_6px_-1px_rgba(100,116,139,0.4)]'
          : 'bg-gradient-to-r from-[#10B981] to-[#34D399] shadow-[0_2px_6px_-1px_rgba(16,185,129,0.4)]'
      }`}
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
          className={`relative z-10 ${compact ? 'h-8' : 'h-9'} rounded-lg flex items-center justify-center gap-1 text-[12px] font-bold transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
            on ? 'text-white' : 'text-slate-600 active:bg-white/70'
          }`}
        >
          {yes ? (
            <Check className={`w-3.5 h-3.5 stroke-[3] transition-colors ${on ? '' : 'text-[#10B981]'}`} />
          ) : (
            <X className={`w-3.5 h-3.5 stroke-[3] transition-colors ${on ? '' : 'text-[#94A3B8]'}`} />
          )}
          {yes ? 'Allowed' : 'Not Allowed'}
        </button>
      );
    })}
  </div>
);

/** V1 mode cards: Allowed / Not Allowed as two separate pills; tapping the active pill clears it */
export const AllowPills: React.FC<{
  value: YesNo | null;
  onChange: (v: YesNo) => void;
  label: string;
  disabled?: boolean;
}> = ({ value, onChange, label, disabled }) => (
  <div role="radiogroup" aria-label={label} className={`flex gap-2 ${disabled ? 'opacity-60' : ''}`}>
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
          className={`flex-1 h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
            on
              ? yes
                ? 'bg-[#10B981] border-[#10B981] text-white'
                : 'bg-[#FEF2F2] border-[#EF4444] text-[#EF4444]'
              : yes
              ? 'bg-white border-slate-200 text-[#10B981] active:bg-[#E8F8F0]'
              : 'bg-white border-slate-200 text-slate-500 active:bg-slate-50'
          }`}
        >
          {yes ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
          {yes ? 'Allowed' : 'Not Allowed'}
        </button>
      );
    })}
  </div>
);

/** V2: Allowed / Not Allowed as two selectable tiles with a radio dot; tapping the active tile clears it */
export const AllowChoice: React.FC<{
  value: YesNo | null;
  onChange: (v: YesNo) => void;
  label: string;
  disabled?: boolean;
  compact?: boolean;
}> = ({ value, onChange, label, disabled, compact }) => (
  <div role="radiogroup" aria-label={label} className={`grid grid-cols-2 gap-2 ${disabled ? 'opacity-60' : ''}`}>
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
          className={`${compact ? 'h-10' : 'h-11'} rounded-xl px-3 border flex items-center gap-2 text-xs font-bold shadow-2xs transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
            on
              ? yes
                ? 'border-[#10B981] bg-[#E8F8F0] text-[#10B981]'
                : 'border-[#EF4444] bg-[#FEF2F2] text-[#EF4444]'
              : 'border-slate-200 bg-white text-slate-500 active:bg-slate-50'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              on ? (yes ? 'bg-[#10B981] text-white' : 'border-2 border-[#EF4444] text-[#EF4444]') : 'border-2 border-slate-300'
            }`}
            aria-hidden="true"
          >
            {on && (yes ? <Check className="w-3 h-3 stroke-[3.5]" /> : <X className="w-3 h-3 stroke-[3.5]" />)}
          </span>
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
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 tabular-nums">
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
        className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || disabled}
        className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
    className="shrink-0 h-11 px-3 rounded-xl border border-[#BFDBFE] bg-blue-50 text-[11px] font-bold text-[#2F68FE] active:bg-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {label}
  </button>
);

/** Mock save delay (desktop shows "Saving…" while the AJAX call runs) */
export const WORK_FLEX_SAVE_MS = 700;
