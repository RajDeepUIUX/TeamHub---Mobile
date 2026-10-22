import React from 'react';
import { Info, Lock, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { Card, SheetHeader } from '../staff/tabs/StaffTabParts';

/* Shared by User Profile and Company Profile */

export type Row = { label: string; value: string; wide?: boolean; locked?: boolean; href?: string; onInfo?: () => void };

/** Desktop green ⓘ (tooltip there) — opens a FieldInfoSheet on mobile */
export const InfoButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    aria-label={`About ${label}`}
    className="w-8 h-8 -my-2 -mr-2 flex items-center justify-center rounded-full text-[#0E9F6E] active:bg-emerald-50 cursor-pointer"
  >
    <Info className="w-4 h-4" />
  </button>
);

/** Bottom drawer carrying the desktop tooltip copy */
export const FieldInfoSheet: React.FC<{ info: { title: string; text: string } | null; onClose: () => void }> = ({ info, onClose }) => (
  <BottomSheet isOpen={Boolean(info)} onClose={onClose} maxHeight="max-h-[70%]">
    <SheetHeader title={info?.title ?? ''} onClose={onClose} />
    <div className="px-5 pt-4 pb-6 overflow-y-auto">
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0]">
        <span className="w-9 h-9 rounded-xl bg-white text-[#0E9F6E] flex items-center justify-center shrink-0">
          <Info className="w-4.5 h-4.5" />
        </span>
        <p className="text-[12.5px] text-[#1E293B] leading-relaxed">{info?.text}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full h-12 rounded-xl bg-[#4F46E5] text-white text-xs font-bold active:bg-[#4338CA] cursor-pointer"
      >
        Got it
      </button>
    </div>
  </BottomSheet>
);

/** Label / value grid; unlike staff tabs, empty values stay visible as "Not added" so the user knows what to fill */
export const ValueGrid: React.FC<{ rows: Row[] }> = ({ rows }) => (
  <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">
    {rows.map((r) => (
      <div key={r.label} className={`min-w-0 ${r.wide ? 'col-span-2' : ''}`}>
        <dt className="flex items-center gap-1 text-[11px] text-slate-400">
          {r.label}
          {r.locked && <Lock className="w-2.5 h-2.5" aria-label="Locked" />}
          {r.onInfo && <InfoButton label={r.label} onClick={r.onInfo} />}
        </dt>
        <dd className={`mt-0.5 text-[13px] leading-snug break-words ${r.value ? 'font-medium text-[#1E293B]' : 'italic text-slate-400'}`}>
          {r.value && r.href ? (
            <a
              href={r.href}
              target={r.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="text-[#2F68FE] active:text-[#1D4ED8]"
            >
              {r.value}
            </a>
          ) : (
            r.value || 'Not added'
          )}
        </dd>
      </div>
    ))}
  </dl>
);

export const SectionCard: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between gap-2 pb-2.5 mb-3.5 border-b border-slate-100 min-h-8">
      <h2 className="text-[13px] font-bold text-[#1E293B]">{title}</h2>
      {action}
    </div>
    {children}
  </Card>
);

/** Desktop (MyCPE ONE) section card: grey title band + white body */
export const BandSectionCard: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
  <section className="bg-white rounded-2xl border border-[#DCE3ED] shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)] overflow-hidden">
    <div className="min-h-12 px-4 py-2 flex items-center justify-between gap-2 bg-[#F3F4F8]">
      <h2 className="text-sm font-bold text-[#1E293B]">{title}</h2>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

/** Titled sub-group inside a section card (icon + small caps title, optional right action and hint) */
export const FieldGroup: React.FC<{
  icon: React.ElementType;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon: Icon, title, hint, action, children }) => (
  <div className="pt-4 mt-4 border-t border-dashed border-slate-200 first:mt-0 first:pt-0 first:border-0">
    <div className="flex items-center justify-between gap-2 mb-3 min-h-7">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{title}</h3>
          {hint && <p className="text-[10.5px] text-slate-400 leading-snug truncate">{hint}</p>}
        </div>
      </div>
      {action}
    </div>
    {children}
  </div>
);

/** Selected values under a multi-select, each removable (B tag chips with ✕) */
export const RemovableTags: React.FC<{ items: string[]; onRemove: (v: string) => void }> = ({ items, onRemove }) =>
  items.length ? (
    <div className="flex flex-wrap gap-1.5 pt-0.5">
      {items.map((t) => (
        <span key={t} className="inline-flex items-center gap-0.5 pl-2.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8]">
          {t}
          <button
            type="button"
            onClick={() => onRemove(t)}
            aria-label={`Remove ${t}`}
            className="w-7 h-7 -my-1 flex items-center justify-center rounded-full active:bg-blue-100 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  ) : null;

export const Label: React.FC<{ text: string; required?: boolean; hint?: string; onInfo?: () => void }> = ({ text, required, hint, onInfo }) => (
  <span className="flex items-baseline justify-between gap-2 text-xs font-bold text-[#1E293B]">
    <span className="flex items-center gap-1">
      <span>
        {text}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {onInfo && <InfoButton label={text} onClick={onInfo} />}
    </span>
    {hint && <span className="text-[10.5px] font-medium text-slate-400 tabular-nums">{hint}</span>}
  </span>
);

export const ErrorText: React.FC<{ error?: string }> = ({ error }) =>
  error ? <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p> : null;

/** Read-only field in edit mode, with the reason it can't be changed here */
export const LockedField: React.FC<{ label: string; value: string; note?: string; required?: boolean; onInfo?: () => void }> = ({
  label,
  value,
  note,
  required,
  onInfo,
}) => (
  <div className="space-y-1.5">
    <Label text={label} required={required} onInfo={onInfo} />
    <div className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
      <span className="truncate">{value}</span>
      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
    </div>
    {note && <p className="px-0.5 text-[10.5px] text-slate-400 leading-relaxed">{note}</p>}
  </div>
);

export const DisabledSelect: React.FC<{ text: string }> = ({ text }) => (
  <div className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-xs font-medium text-slate-400">{text}</div>
);

export const ProfileSkeleton: React.FC<{ label?: string }> = ({ label = 'Loading profile' }) => (
  <div className="px-4 mt-4 space-y-3" aria-busy="true" aria-label={label}>
    <div className="bg-white border border-[#DCE3ED] rounded-2xl p-4">
      <div className="flex items-center gap-3.5">
        <StaffSkeleton className="w-18 h-18 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <StaffSkeleton className="w-36 h-4.5" />
          <StaffSkeleton className="w-28 h-3" />
          <StaffSkeleton className="w-20 h-5 rounded-md" />
        </div>
      </div>
      <div className="mt-4 flex gap-1.5">
        <StaffSkeleton className="w-32 h-6 rounded-full" />
        <StaffSkeleton className="w-24 h-6 rounded-full" />
      </div>
    </div>
    {[0, 1].map((i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-4 space-y-3.5">
        <StaffSkeleton className="w-28 h-4" />
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((j) => (
            <div key={j} className="space-y-1.5">
              <StaffSkeleton className="w-14 h-2.5" />
              <StaffSkeleton className="w-24 h-3.5" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
