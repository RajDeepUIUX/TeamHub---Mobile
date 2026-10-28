import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Info, Search, X } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import { DateWheelSheet } from '../../../common/DateWheelSheet';

export type Field = { label: string; value: string | null | undefined; wide?: boolean };

/** Desktop label/value grid: 2 columns on mobile, long values span the row; empty values hidden (desktop `{if !empty}`) */
export const FieldGrid: React.FC<{ fields: Field[]; compact?: boolean }> = ({ fields, compact }) => (
  <dl className={`grid grid-cols-2 gap-x-4 ${compact ? 'gap-y-2.5 mt-2.5' : 'gap-y-3 mt-3'}`}>
    {fields
      .filter((f) => f.value)
      .map((f) => (
        <div key={f.label} className={`min-w-0 ${f.wide ? 'col-span-2' : ''}`}>
          <dt className={`${compact ? 'text-[11px]' : 'text-[11px]'} text-slate-400`}>{f.label}</dt>
          <dd className={`mt-0.5 text-xs font-semibold text-[#1E293B] leading-snug break-words tabular-nums`}>
            {f.value}
          </dd>
        </div>
      ))}
  </dl>
);

export type Row = { label: string; value: React.ReactNode; wide?: boolean };

/** V2 detail rows: label left, value right, hairline dividers; `wide` values drop under the label; empty values hidden */
export const RowList: React.FC<{ rows: Row[]; className?: string }> = ({ rows, className = '' }) => (
  <dl className={`divide-y divide-slate-100 ${className}`}>
    {rows
      .filter((r) => r.value !== null && r.value !== undefined && r.value !== '')
      .map((r) => (
        <div key={r.label} className={`py-2.5 ${r.wide ? '' : 'flex items-start justify-between gap-4'}`}>
          <dt className="min-w-0 text-[11px] text-slate-400 leading-snug">{r.label}</dt>
          <dd className={`min-w-0 text-xs font-semibold text-[#1E293B] leading-snug break-words tabular-nums ${r.wide ? 'mt-0.5' : 'text-right'}`}>
            {r.value}
          </dd>
        </div>
      ))}
  </dl>
);

/** V2 card heading: gradient icon tile + title (+ optional trailing node) */
export const CardHeading: React.FC<{ icon: React.ElementType; title: React.ReactNode; sub?: React.ReactNode; trailing?: React.ReactNode }> = ({
  icon: Icon,
  title,
  sub,
  trailing,
}) => (
  <div className="flex items-center gap-3">
    <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
      <Icon className="w-4 h-4" />
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-bold text-[#1E293B] leading-snug break-words">{title}</p>
      {sub && <p className="text-[11px] text-slate-400 leading-snug truncate">{sub}</p>}
    </div>
    {trailing}
  </div>
);

/** V2 two-way switch: large tiles with icon, label and optional count (replaces the segmented control) */
export function SwitchTiles<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string; icon: React.ElementType; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="p-1 rounded-xl bg-white border border-[#EBF0F7] shadow-2xs grid grid-cols-2 gap-1" role="tablist" aria-label={label}>
      {options.map((o) => {
        const on = o.id === value;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={`h-9 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
              on ? 'bg-[#2F68FE] text-white shadow-xs' : 'text-slate-500 active:bg-slate-50'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${on ? '' : 'text-[#2F68FE]'}`} aria-hidden="true" />
            <span className="min-w-0 truncate text-xs font-bold">{o.label}</span>
            {o.count !== undefined && (
              <span
                className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${
                  on ? 'bg-white text-[#2F68FE]' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** V2 card with a coloured status strip on the left edge */
export const AccentCard: React.FC<{ accent: string; children: React.ReactNode; className?: string }> = ({ accent, children, className = '' }) => (
  <Card className={`relative overflow-hidden ${className}`}>
    <span aria-hidden="true" className={`absolute left-0 inset-y-0 w-1 ${accent}`} />
    {children}
  </Card>
);

export const ACCENT: Record<Tone, string> = {
  green: 'bg-[#10B981]',
  amber: 'bg-[#F59E0B]',
  rose: 'bg-rose-500',
  blue: 'bg-[#2F68FE]',
  indigo: 'bg-[#4F46E5]',
  slate: 'bg-slate-300',
};

/** Section title + optional action; title is left out where the tab pill already names the section */
export const TabTitle: React.FC<{ title?: string; action?: React.ReactNode }> = ({ title, action }) => (
  <div className={`flex items-center gap-3 min-h-9 ${title ? 'justify-between' : 'justify-end'}`}>
    {title && <h3 className="px-1 text-sm font-bold text-[#1E293B]">{title}</h3>}
    {action}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs ${className}`}>{children}</section>
);

/** One white card per titled group (Personal / Work / Terms tabs), title over a hairline like Staff My Profile */
export const InfoCard: React.FC<{ groups: { title: string; fields: Field[] }[] }> = ({ groups }) => (
  <div className="mt-2.5 space-y-3">
    {groups.map((g) => (
      <Card key={g.title} className="p-4">
        <h4 className="pb-2.5 border-b border-slate-100 text-sm font-bold text-[#1E293B] leading-snug">{g.title}</h4>
        <FieldGrid fields={g.fields} />
      </Card>
    ))}
  </div>
);

export type Tone = 'green' | 'amber' | 'rose' | 'blue' | 'indigo' | 'slate';

const TONE: Record<Tone, string> = {
  green: 'bg-[#E8F8F0] text-[#10B981]',
  amber: 'bg-[#FEF8E7] text-[#D97706]',
  rose: 'bg-[#FEF2F2] text-rose-600',
  blue: 'bg-[#EFF6FF] text-[#2F68FE]',
  indigo: 'bg-[#EEF2FF] text-[#4F46E5]',
  slate: 'bg-slate-100 text-slate-500',
};

export const Pill: React.FC<{ tone: Tone; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap ${TONE[tone]}`}>{children}</span>
);

export const EmptyCard: React.FC<{ icon: React.ElementType; title: string; text?: string; action?: React.ReactNode }> = ({
  icon: Icon,
  title,
  text,
  action,
}) => (
  <Card className="py-10 px-6 flex flex-col items-center text-center">
    <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
      <Icon className="w-6 h-6" />
    </span>
    <p className="mt-3 text-sm font-bold text-[#1E293B]">{title}</p>
    {text && <p className="mt-1 text-xs text-slate-500">{text}</p>}
    {action}
  </Card>
);

/** Horizontally scrolling single-select chips with optional counts */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  counts,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  counts?: Partial<Record<T, number>>;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [value]);
  return (
    <div ref={ref} className="-mx-4 flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-1" role="group" aria-label={label}>
      {options.map((o) => {
        const on = o === value;
        const count = counts?.[o];
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o)}
            className={`shrink-0 h-8 pl-3 ${count !== undefined ? 'pr-1.5' : 'pr-3'} rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
            }`}
          >
            {o}
            {count !== undefined && (
              <span className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums bg-white ${on ? 'text-[#2F68FE]' : 'text-slate-500'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Same as Staff / Manager search boxes: `page` = list screens (CelebrationsView), `sheet` = inside a bottom sheet (MultiSelectSheet)
 */
export const SearchField: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string; variant?: 'page' | 'sheet'; compact?: boolean }> = ({
  value,
  onChange,
  placeholder,
  variant = 'page',
  compact,
}) => (
  <div className="relative">
    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={
        variant === 'sheet'
          ? 'w-full h-11 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text [&::-webkit-search-cancel-button]:hidden'
          : `w-full ${compact ? 'h-10' : 'h-11'} pl-10 pr-9 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 shadow-2xs select-text [&::-webkit-search-cancel-button]:hidden`
      }
    />
    {value &&
      (variant === 'sheet' ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-3 h-3" />
        </button>
      ))}
  </div>
);

/** Module screen header (Staff / Manager style): back arrow + title centred on the screen */
export const ScreenHeader: React.FC<{
  title: string;
  onBack?: () => void;
  backLabel?: string;
  /** Design version switch shown beside the centred title */
  version?: { versions: readonly DesignVersion[]; value: DesignVersion; onChange: (v: DesignVersion) => void };
}> = ({ title, onBack, backLabel = 'Back to Dashboard', version }) => (
  <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
    )}
    {version ? (
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-96px)] flex items-center gap-2">
        <h1 className="min-w-0 text-base font-bold truncate">{title}</h1>
        <DesignVersionSwitch {...version} />
      </div>
    ) : (
      <h1 className="text-base font-bold screen-title">{title}</h1>
    )}
  </header>
);

export type DesignVersion = 'V1' | 'V2' | 'V3';

/** Header design switcher (same as Team Attendance) — previews alternate layouts of one screen */
export const DesignVersionSwitch: React.FC<{
  versions: readonly DesignVersion[];
  value: DesignVersion;
  onChange: (v: DesignVersion) => void;
}> = ({ versions, value, onChange }) => (
  <div className="shrink-0 flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/70" role="tablist" aria-label="Design version">
    {versions.map((v) => (
      <button
        key={v}
        type="button"
        role="tab"
        aria-selected={value === v}
        onClick={() => onChange(v)}
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
          value === v ? 'bg-white text-[#2F68FE] shadow-2xs' : 'text-slate-500'
        }`}
      >
        {v}
      </button>
    ))}
  </div>
);

export const SheetHeader: React.FC<{ title: string; subtitle?: string; onClose: () => void }> = ({ title, subtitle, onClose }) => (
  <>
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-[#1E293B] truncate">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 shrink-0 cursor-pointer"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </>
);

/** Bottom drawer for ⓘ info copy — every client ⓘ button opens its message here */
export const InfoSheet: React.FC<{ isOpen: boolean; title: string; onClose: () => void; children: React.ReactNode; extra?: React.ReactNode }> = ({
  isOpen,
  title,
  onClose,
  children,
  extra,
}) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[60%]">
    <SheetHeader title={title} onClose={onClose} />
    <div className="px-5 pt-4 pb-8 overflow-y-auto no-scrollbar">
      <div className="flex gap-3 p-3.5 rounded-2xl bg-[#F8FAFC] ring-1 ring-inset ring-[#BFDBFE]">
        <span className="w-9 h-9 rounded-xl bg-white ring-1 ring-[#BFDBFE] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
          <Info className="w-[18px] h-[18px]" />
        </span>
        <div className="min-w-0 text-xs text-slate-600 leading-relaxed">{children}</div>
      </div>
      {extra}
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full h-11 rounded-xl bg-[#2F68FE] text-white text-[13px] font-bold active:bg-[#1D4ED8] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
      >
        Got it
      </button>
    </div>
  </BottomSheet>
);

/** Desktop confirm popups (delete / publish / status change) */
export const ConfirmSheet: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  note?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ isOpen, title, message, note, confirmLabel, danger, onConfirm, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[60%]">
    <SheetHeader title={title} onClose={onClose} />
    <div className="px-5 py-4">
      <p className="text-[13px] text-[#1E293B] leading-relaxed">{message}</p>
      {note && <p className="mt-2 px-3 py-2 rounded-xl bg-[#FEF8E7] border border-amber-200/50 text-xs text-amber-700">{note}</p>}
    </div>
    <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
      <button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={`h-12 rounded-xl text-white text-xs font-bold cursor-pointer ${danger ? 'bg-rose-500 active:bg-rose-600' : 'bg-[#2F68FE] active:bg-[#1D4ED8]'}`}
      >
        {confirmLabel}
      </button>
    </div>
  </BottomSheet>
);

/** Short success banner (desktop toastr) shown at the top of a tab */
export const useNotice = () => {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((msg: string) => {
    clearTimeout(timer.current);
    setText(msg);
    timer.current = setTimeout(() => setText(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = text ? (
    <div role="status" className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#E8F8F0] border border-emerald-200/50 text-[12px] font-semibold text-emerald-700 animate-in fade-in slide-in-from-top-1 duration-200">
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span className="flex-1">{text}</span>
    </div>
  ) : null;
  return [node, show] as const;
};

/** Staff / Manager form input (ExpenseReimbursementView, TicketActionSheets): label, h-11 box, blue focus ring, rose error */
export const fieldInputClass = (error?: string) =>
  `w-full h-11 px-3.5 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
    error ? 'border-rose-300' : 'border-slate-200'
  }`;

const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <span className="block text-xs font-bold text-[#1E293B]">
    {label}
    {required && <span className="text-rose-500"> *</span>}
  </span>
);

const FieldError: React.FC<{ error?: string }> = ({ error }) =>
  error ? <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p> : null;

export const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  type?: string;
  placeholder?: string;
}> = ({ label, value, onChange, required, error, type = 'text', placeholder }) => (
  <label className="block space-y-1.5">
    <FieldLabel label={label} required={required} />
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-invalid={Boolean(error)}
      className={fieldInputClass(error)}
    />
    <FieldError error={error} />
  </label>
);

const formatWheelDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

/** Single date → Day / Month / Year wheels, like Staff My Profile date fields (no native date input) */
export const DateField: React.FC<{
  label: string;
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  error?: string;
  min?: string;
  max?: string;
}> = ({ label, value, onChange, required, error, min, max }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} required={required} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        className={`${fieldInputClass(error)} flex items-center justify-between gap-2 text-left cursor-pointer`}
      >
        <span className={`truncate ${value ? '' : 'text-slate-400'}`}>{value ? formatWheelDate(value) : 'Select date'}</span>
        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      <FieldError error={error} />
      <DateWheelSheet
        isOpen={open}
        title={label}
        value={value}
        min={min}
        max={max}
        onClose={() => setOpen(false)}
        onApply={(iso) => {
          onChange(iso);
          setOpen(false);
        }}
      />
    </div>
  );
};
