import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, CircleAlert, Search, Sparkles, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { todayIso, WheelColumn } from '../../common/DateWheelSheet';
import { McButton } from '../common/McUi';
import { Check } from 'lucide-react';
import { useMcFieldStyle } from '../common/McFieldStyle';
import { Allocation, formatDate } from './certModel';

/* ------------------------------------- Field ------------------------------------- */

interface FieldProps {
  label: string;
  required?: boolean;
  /** Filled by AI and not edited since */
  ai?: boolean;
  error?: string;
  /** Where "scroll to the first invalid field" finds it */
  errorKey?: string;
  /** Text box that can carry its label on its border (MyCPE design): whether it's focused or filled */
  floated?: boolean;
  children: (ids: { labelId: string; errorId: string | undefined }) => React.ReactNode;
}

export const McErrorText: React.FC<{ id?: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1 text-xs leading-4 font-medium text-mc-error">
      <CircleAlert className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden="true" />
      {message}
    </p>
  ) : null;

const AiTag = () => (
  <span className="h-[18px] px-1.5 rounded-full bg-mc-primary-tint text-[10.5px] font-semibold text-mc-indigo inline-flex items-center gap-1 shrink-0">
    <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
    AI-filled
  </span>
);

export const useFloating = () => useMcFieldStyle() === 'floating';

/** MyCPE design: the label sits inside an empty box and moves onto its top border once focused or filled */
export const McFloatLabel: React.FC<{ id?: string; label: string; floated: boolean; required?: boolean; ai?: boolean; compact?: boolean }> = ({
  id,
  label,
  floated,
  required,
  ai,
  compact,
}) => (
  <span
    className={`absolute pointer-events-none flex items-center justify-between gap-2 ${
      floated ? `-top-2.5 ${compact ? 'left-[7px] right-1' : 'left-[11px] right-2'}` : `inset-y-0 ${compact ? 'left-[11px] right-1' : 'left-[15px] right-11'}`
    }`}
  >
    <span id={id} className={`min-w-0 truncate text-mc-muted ${floated ? 'px-1 h-5 leading-[18px] rounded-t-[4px] bg-white text-xs' : compact ? 'text-[13px]' : 'text-sm'}`}>
      {label}
      {required && (
        <span className="text-mc-error" aria-label="required">
          {' *'}
        </span>
      )}
    </span>
    {ai && (
      <span className="px-1 rounded-full bg-white inline-flex shrink-0">
        <AiTag />
      </span>
    )}
  </span>
);

export const McLabeled: React.FC<FieldProps> = ({ label, required, ai, error, errorKey, floated, children }) => {
  const id = useId();
  const floating = useFloating();
  if (floating && floated !== undefined)
    return (
      <div data-error-key={errorKey} className="min-w-0">
        <div className="relative">
          {children({ labelId: `${id}-label`, errorId: error ? `${id}-error` : undefined })}
          <McFloatLabel id={`${id}-label`} label={label} floated={floated} required={required} ai={ai} />
        </div>
        <McErrorText id={`${id}-error`} message={error} />
      </div>
    );
  return (
    <div data-error-key={errorKey} className="min-w-0">
      <div id={`${id}-label`} className="mb-1 min-h-5 flex items-center flex-wrap gap-x-1.5 text-[13px] leading-5 font-medium text-mc-ink-2">
        <span>
          {label}
          {required && (
            <span className="text-mc-error" aria-label="required">
              {' *'}
            </span>
          )}
        </span>
        {ai && <AiTag />}
      </div>
      {children({ labelId: `${id}-label`, errorId: error ? `${id}-error` : undefined })}
      <McErrorText id={`${id}-error`} message={error} />
    </div>
  );
};

/** Follows the studio's Text box switch: the MyCPE design's square 52px box, or the rounded HRMS look */
export const useBox = () => {
  const floating = useFloating();
  return (error?: string) =>
    `w-full bg-white border text-mc-ink transition-colors outline-hidden focus-visible:border-mc-primary ${
      floating ? 'min-h-13 rounded-[4px] text-sm' : 'min-h-12 rounded-xl text-base focus-visible:ring-3 focus-visible:ring-mc-primary-soft'
    } ${error ? 'border-mc-error' : floating ? 'border-mc-line' : 'border-mc-line-strong'}`;
};

/** Gap between fields: labels on the border need a little more room */
export const useStack = () => (useFloating() ? 'space-y-5' : 'space-y-3');

type BaseProps = Omit<FieldProps, 'children'>;

/** Wraps onto more lines instead of scrolling sideways */
export const McTextField: React.FC<BaseProps & { value: string; placeholder: string; onChange: (v: string) => void; autoFocus?: boolean }> = ({
  value,
  placeholder,
  onChange,
  autoFocus,
  ...field
}) => {
  const box = useBox();
  const floating = useFloating();
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    // Browsers with field-sizing grow it themselves
    if (!el || CSS.supports('field-sizing', 'content')) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value, floating]);
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <McLabeled {...field} floated={focused || value !== ''}>
      {({ labelId, errorId }) => (
        <textarea
          ref={ref}
          rows={1}
          value={value}
          placeholder={floating ? undefined : placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-labelledby={labelId}
          aria-required={field.required}
          aria-invalid={Boolean(field.error)}
          aria-describedby={errorId}
          enterKeyHint="done"
          onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            e.currentTarget.blur();
          }}
          className={`${box(field.error)} block [field-sizing:content] resize-none overflow-hidden ${floating ? 'px-[15px] py-[15px] leading-5' : 'px-3.5 py-[11px] leading-6'} placeholder:text-[#98A2B3] select-text`}
        />
      )}
    </McLabeled>
  );
};

/** Opens a sheet; always one line, since the sheet shows the value in full */
export const McPickField: React.FC<BaseProps & { value: string; placeholder: string; onOpen: () => void; icon?: 'chevron' | 'calendar'; ariaLabel?: string }> = ({
  value,
  placeholder,
  onOpen,
  icon = 'chevron',
  ...field
}) => (
  <McLabeled {...field} floated={value !== ''}>
    {({ labelId, errorId }) => <PickButton value={value} placeholder={placeholder} onOpen={onOpen} icon={icon} error={field.error} labelledBy={labelId} describedBy={errorId} />}
  </McLabeled>
);

export const PickButton: React.FC<{
  value: string;
  placeholder: string;
  onOpen: () => void;
  icon?: 'chevron' | 'calendar';
  error?: string;
  labelledBy?: string;
  describedBy?: string;
  ariaLabel?: string;
  /** Narrow field: less padding, so long words fit */
  compact?: boolean;
}> = ({ value, placeholder, onOpen, icon = 'chevron', error, labelledBy, describedBy, ariaLabel, compact }) => {
  const box = useBox();
  const floating = useFloating();
  const id = useId();
  const Icon = icon === 'calendar' ? CalendarDays : ChevronDown;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={ariaLabel && `${ariaLabel}: ${value || placeholder}`}
      aria-labelledby={labelledBy && `${labelledBy} ${id}`}
      aria-describedby={describedBy}
      onClick={onOpen}
      className={`${box(error)} py-2 flex items-center text-left cursor-pointer ${
        floating ? (compact ? 'px-[11px] gap-1' : 'px-[15px] gap-2') : compact ? 'px-2.5 gap-1' : 'px-3.5 gap-2'
      }`}
    >
      <span id={id} className={`flex-1 min-w-0 truncate ${floating ? 'leading-5' : 'leading-[22px]'} ${value ? (compact ? 'text-sm text-mc-ink' : 'text-mc-ink') : compact ? 'text-[13px] text-[#98A2B3]' : 'text-[#98A2B3]'}`}>
        {value || (floating ? '\u00A0' : placeholder)}
      </span>
      {floating && icon === 'chevron' ? (
        <svg viewBox="0 0 14 9" className={`shrink-0 text-mc-muted ${compact ? 'w-2.5 h-[7px]' : 'w-3.5 h-[9px]'}`} aria-hidden="true">
          <path d="M0 0h14L7 9z" fill="currentColor" />
        </svg>
      ) : (
        <Icon className={`shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'} ${icon === 'calendar' && !floating ? 'text-mc-primary' : 'text-mc-muted'}`} aria-hidden="true" />
      )}
    </button>
  );
};

export const McYesNo: React.FC<BaseProps & { value: boolean | null; onChange: (v: boolean) => void }> = ({ value, onChange, ...field }) => {
  const floating = useFloating();
  return (
    <McLabeled {...field}>
      {({ labelId, errorId }) => (
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          aria-describedby={errorId}
          className={`h-[54px] grid grid-cols-2 border ${floating ? 'rounded-[4px] bg-white overflow-hidden divide-x divide-mc-line' : 'p-1 gap-1 rounded-xl bg-mc-line'} ${
            field.error ? 'border-mc-error' : floating ? 'border-mc-line' : 'border-transparent'
          }`}
        >
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={value === v}
              onClick={() => value !== v && onChange(v)}
              className={`font-semibold transition-colors cursor-pointer ${floating ? 'text-sm' : 'text-[15px] rounded-lg'} ${
                value !== v ? 'text-mc-text' : floating ? 'bg-mc-primary-tint text-mc-indigo' : 'bg-white text-mc-indigo shadow-[0_1px_3px_rgba(16,24,40,0.14)]'
              }`}
            >
              {v ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      )}
    </McLabeled>
  );
};

/* ------------------------------------- Sheets ------------------------------------ */

export const McSheetHandle = () => (
  <div className="pt-2.5 flex justify-center shrink-0">
    <span className="w-14 h-1 rounded-full bg-mc-line-strong" />
  </div>
);

export const McSheetHeader: React.FC<{ title: string; onClose: () => void; action?: React.ReactNode }> = ({ title, onClose, action }) => (
  <div className="pl-4 pr-1.5 pt-1 pb-1 flex items-center gap-2 shrink-0">
    <h2 className="flex-1 text-lg leading-7 font-semibold text-mc-ink">{title}</h2>
    {action}
    <button type="button" onClick={onClose} className="w-12 h-12 flex items-center justify-center text-mc-text cursor-pointer" aria-label="Close">
      <X className="w-5 h-5" />
    </button>
  </div>
);

interface OptionSheetProps {
  isOpen: boolean;
  title: string;
  options: string[];
  /** Can't be chosen, with the reason shown */
  disabled?: { options: string[]; note: string };
  onClose: () => void;
}

const useSearch = (isOpen: boolean, options: string[]) => {
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);
  const q = query.trim().toLowerCase();
  return { query, setQuery, list: options.filter((o) => o.toLowerCase().includes(q)) };
};

const SearchBox: React.FC<{ value: string; onChange: (v: string) => void; label: string }> = ({ value, onChange, label }) => {
  const box = useBox();
  return (
    <div className="px-4 pb-2 shrink-0">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-mc-muted pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          aria-label={label}
          className={`${box()} h-12 pl-11 pr-3.5 placeholder:text-[#98A2B3] select-text [&::-webkit-search-cancel-button]:hidden`}
        />
      </div>
    </div>
  );
};

const ROW = 'w-full min-h-[52px] py-3 flex items-center gap-3 text-left text-base leading-[22px] text-mc-ink-2 cursor-pointer disabled:cursor-not-allowed disabled:text-[#98A2B3]';

/** Searchable for long lists, plain for short ones */
export const McSingleSheet: React.FC<OptionSheetProps & { value: string | null; onSelect: (v: string) => void }> = ({
  isOpen,
  title,
  options,
  disabled,
  value,
  onSelect,
  onClose,
}) => {
  const { query, setQuery, list } = useSearch(isOpen, options);
  const long = options.length > 5;
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight={long ? 'h-[82%]' : 'max-h-[82%]'} className="font-mc text-mc-ink">
      <McSheetHandle />
      <McSheetHeader title={title} onClose={onClose} />
      {long && <SearchBox value={query} onChange={setQuery} label={`Search ${title}`} />}
      <div role="radiogroup" aria-label={title} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-8 divide-y divide-mc-line">
        {list.map((o) => {
          const off = disabled?.options.includes(o) ?? false;
          const on = o === value;
          return (
            <button key={o} type="button" role="radio" aria-checked={on} disabled={off} onClick={() => onSelect(o)} className={ROW}>
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-mc-primary' : 'border-mc-line-strong'}`}>
                {on && <span className="w-2.5 h-2.5 rounded-full bg-mc-primary" />}
              </span>
              <span className={`flex-1 ${on ? 'font-semibold' : ''}`}>{o}</span>
              {off && <span className="text-xs text-mc-muted">{disabled!.note}</span>}
            </button>
          );
        })}
        {list.length === 0 && <p className="py-10 text-center text-sm text-mc-muted">No results found</p>}
      </div>
    </BottomSheet>
  );
};

/** Choices apply on Done; searching keeps them */
export const McMultiSheet: React.FC<OptionSheetProps & { selected: string[]; onDone: (v: string[]) => void }> = ({ isOpen, title, options, selected, onDone, onClose }) => {
  const { query, setQuery, list } = useSearch(isOpen, options);
  const [picked, setPicked] = useState(selected);
  useEffect(() => {
    if (isOpen) setPicked(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="h-[82%]" className="font-mc text-mc-ink">
      <McSheetHandle />
      <McSheetHeader
        title={title}
        onClose={onClose}
        action={
          picked.length > 0 && (
            <button type="button" onClick={() => setPicked([])} className="h-12 px-2 text-sm font-semibold text-mc-primary cursor-pointer">
              Clear
            </button>
          )
        }
      />
      <SearchBox value={query} onChange={setQuery} label={`Search ${title}`} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 divide-y divide-mc-line">
        {list.map((o) => {
          const on = picked.includes(o);
          return (
            <button
              key={o}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => setPicked((p) => (on ? p.filter((x) => x !== o) : [...p, o]))}
              className={ROW}
            >
              <span
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? 'border-mc-primary bg-mc-primary text-white' : 'border-mc-line-strong bg-white'}`}
              >
                {on && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </span>
              <span className={`flex-1 ${on ? 'font-semibold' : ''}`}>{o}</span>
            </button>
          );
        })}
        {list.length === 0 && <p className="py-10 text-center text-sm text-mc-muted">No results found</p>}
      </div>
      <div className="shrink-0 px-4 pt-3 pb-6 border-t border-mc-line flex items-center gap-4">
        <p className="text-sm font-medium text-mc-text whitespace-nowrap" aria-live="polite">
          {picked.length} selected
        </p>
        <McButton size="md" onClick={() => onDone(options.filter((o) => picked.includes(o)))}>
          Done
        </McButton>
      </div>
    </BottomSheet>
  );
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

/** Month / Day / Year wheels (shared wheel, MyCPE look) */
export const McDateSheet: React.FC<{ isOpen: boolean; value: string; onClose: () => void; onApply: (iso: string) => void }> = ({ isOpen, value, onClose, onApply }) => {
  const seed = () => {
    const [y, m, d] = (value || todayIso()).split('-').map(Number);
    return { y, m, d };
  };
  const [sel, setSel] = useState(seed);
  useEffect(() => {
    if (isOpen) setSel(seed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();
  const update = (p: Partial<typeof sel>) =>
    setSel((s) => {
      const n = { ...s, ...p };
      return { ...n, d: Math.min(n.d, daysIn(n.y, n.m)) };
    });
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear + 2 - 1990 }, (_, i) => ({ value: 1990 + i, label: String(1990 + i) }));
  const days = Array.from({ length: daysIn(sel.y, sel.m) }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
  const iso = `${sel.y}-${pad(sel.m)}-${pad(sel.d)}`;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[82%]" className="font-mc text-mc-ink">
      <McSheetHandle />
      <McSheetHeader title="Date of Completion" onClose={onClose} />
      <p className="px-4 text-sm text-mc-muted" aria-live="polite">
        {formatDate(iso)}
      </p>
      <div className="relative mx-4 mt-2 h-[200px]">
        <div className="absolute inset-x-0 top-20 h-10 rounded-xl bg-mc-primary-tint border border-mc-primary-soft pointer-events-none" />
        <div className="relative h-full grid grid-cols-3">
          <WheelColumn ariaLabel="Month" items={MONTHS.map((label, i) => ({ value: i + 1, label }))} value={sel.m} onChange={(m) => update({ m })} />
          <WheelColumn ariaLabel="Day" items={days} value={sel.d} onChange={(d) => update({ d })} />
          <WheelColumn ariaLabel="Year" items={years} value={sel.y} onChange={(y) => update({ y })} />
        </div>
      </div>
      <div className="shrink-0 px-4 pt-4 pb-6">
        <McButton size="md" onClick={() => onApply(iso)}>
          Set Date
        </McButton>
      </div>
    </BottomSheet>
  );
};

export interface McConfirm {
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

/** Confirmation used wherever a qualification with credits is about to go */
export const removeQualifications = (dropped: Allocation[], onConfirm: () => void): McConfirm => ({
  title: dropped.length === 1 ? `Remove ${dropped[0].qualification}?` : `Remove ${dropped.length} qualifications?`,
  text: `The field of study and credits entered for ${dropped.length === 1 ? 'it' : 'them'} will be removed.`,
  confirmLabel: 'Remove',
  onConfirm,
});

/** Asked before anything the learner entered is removed */
export const McConfirmSheet: React.FC<{ confirm: McConfirm | null; onClose: () => void }> = ({ confirm, onClose }) => (
  <BottomSheet isOpen={confirm !== null} onClose={onClose} maxHeight="max-h-[70%]" className="font-mc text-mc-ink">
    <McSheetHandle />
    {confirm && (
      <>
        <div className="px-4 pt-4 pb-5">
          <h2 className="text-lg leading-7 font-semibold text-mc-ink">{confirm.title}</h2>
          <p className="mt-1 text-sm leading-5 text-mc-text">{confirm.text}</p>
        </div>
        <div className="px-4 pb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl border border-mc-line-strong bg-white text-[15px] font-semibold text-mc-text active:bg-mc-page cursor-pointer"
          >
            {confirm.cancelLabel ?? 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              confirm.onConfirm();
            }}
            className="h-12 rounded-xl bg-mc-error text-[15px] font-semibold text-white active:opacity-90 cursor-pointer"
          >
            {confirm.confirmLabel}
          </button>
        </div>
      </>
    )}
  </BottomSheet>
);
