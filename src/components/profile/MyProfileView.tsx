import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Clock3,
  Phone,
  User,
  BriefcaseBusiness,
  Sparkles,
  GraduationCap,
  CalendarClock,
  Video,
  Pencil,
  Plus,
  Trash2,
  Check,
  Info,
  CalendarDays,
  Inbox,
  FileText,
  Upload,
  ChevronDown,
  X,
  AlertTriangle,
  Lock,
  UserPlus,
} from 'lucide-react';
import { AcademicQualificationSheet, Qualification, QualificationSheet, parseQualificationData } from './QualificationSheet';
import { citiesOf, statesOf } from '../../data/locations';
import { FileUploadField } from '../common/FileUploadField';
import { ProfileAvatar } from './ProfileAvatar';
import { Dropdown } from '../../design-system/components/Dropdown';
import { BottomSheet } from '../common/BottomSheet';
import { DateWheelSheet, todayIso } from '../common/DateWheelSheet';
import { MultiSelectSheet } from '../common/MultiSelectSheet';
import { TimeWheelSheet } from '../common/TimeWheelSheet';
import { IntroVideoSection } from './IntroVideoSection';
import {
  MyProfileData,
  PROFILE_TABS,
  PROFILE_TAB_SHORT,
  PROFICIENCY_LEVELS,
  ProfileField,
  ProfileSkillsConfig,
  ProfileListConfig,
  ProfileListItem,
  ProfileTabId,
  ProfileValue,
  ProfileValues,
  tenureFrom,
} from '../../data/profileData';
import { AttachmentInput, AttachmentInputHandle } from '../common/AttachmentInput';

interface MyProfileViewProps {
  profile: MyProfileData;
  photoUrl: string | null;
  /** Header title outside edit mode (e.g. a team member's profile opened by their manager) */
  title?: string;
  /** Open straight into edit mode (e.g. from "Edit Profile") */
  startEditing?: boolean;
  /** Tells the parent whether there are unsaved edits (it then asks before leaving for another module) */
  onDirtyChange?: (dirty: boolean) => void;
  onBack: () => void;
  onSave: (profile: MyProfileData) => void;
  /** Short toast for actions outside the form (e.g. "coming soon") */
  onNotify?: (message: string) => void;
}

const TAB_ICONS: Record<ProfileTabId, React.ElementType> = {
  personal: User,
  professional: BriefcaseBusiness,
  skills: Sparkles,
  learning: GraduationCap,
  availability: CalendarClock,
  video: Video,
};

/** Marks list items added in the current edit session */
const NEW_FLAG = '__new';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* Interview slots are stored as "HH:MM-HH:MM" (24h, hourly) */
const slotStart = (slot: string) => Number(slot.slice(0, 2));
const hour12 = (h: number) => h % 12 || 12;
const meridiem = (h: number) => (h % 24 < 12 ? 'AM' : 'PM');
/** "13:00-14:00" → "1–2 PM" */
const slotShort = (slot: string) => {
  const a = slotStart(slot);
  const b = a + 1;
  return meridiem(a) === meridiem(b) ? `${hour12(a)}–${hour12(b)} ${meridiem(b)}` : `${hour12(a)} ${meridiem(a)}–${hour12(b)} ${meridiem(b)}`;
};
/** Merge back-to-back slots: 14–15, 15–16, 16–17 → "2:00 PM – 5:00 PM" */
const slotRanges = (slots: string[]) => {
  const starts = slots.map(slotStart).sort((x, y) => x - y);
  const ranges: [number, number][] = [];
  starts.forEach((h) => {
    const last = ranges[ranges.length - 1];
    if (last && last[1] === h) last[1] = h + 1;
    else ranges.push([h, h + 1]);
  });
  return ranges.map(([a, b]) => `${hour12(a)}:00 ${meridiem(a)} – ${hour12(b)}:00 ${meridiem(b)}`);
};

const formatDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '';

const visibleFields = (fields: ProfileField[], values: ProfileValues) => fields.filter((f) => !f.showIf || f.showIf(values));

/** Splits fields into runs: ungrouped fields, and consecutive fields sharing a group */
const groupRuns = (fields: ProfileField[]) =>
  fields.reduce<{ group?: string; fields: ProfileField[] }[]>((runs, f) => {
    const last = runs[runs.length - 1];
    if (last && last.group === f.group) last.fields.push(f);
    else runs.push({ group: f.group, fields: [f] });
    return runs;
  }, []);

/** Long values and multi-option controls take the full row; short inputs pair up two per row */
const isWide = (f: ProfileField) =>
  Boolean(f.full) ||
  f.type === 'email' ||
  f.type === 'checkbox' ||
  f.type === 'multiselect' ||
  f.type === 'days' ||
  Boolean(f.question) ||
  (f.type === 'radio' && (f.options?.length ?? 0) > 2);

const isReadOnly = (f: ProfileField) => Boolean(f.locked) || f.type === 'auto';

/** Returns an error message for a field, or '' when valid */
const validate = (f: ProfileField, values: ProfileValues): string => {
  const v = values[f.key];
  if (isReadOnly(f)) return '';
  if (f.required && (v === undefined || v === '' || (Array.isArray(v) && v.length === 0))) return `${f.label} is required.`;
  if (f.notEqual && v && v === values[f.notEqual.key]) return `Pick a different domain from the ${f.notEqual.label}.`;
  if (typeof v !== 'string' || !v) return '';
  if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
  if (f.type === 'tel' && !/^\d{10}$/.test(v)) return 'Enter a 10-digit phone number.';
  if (f.type === 'number' && !/^\d{1,2}$/.test(v)) return 'Enter a number.';
  if (f.type === 'year' && (!/^\d{4}$/.test(v) || +v < 1950 || +v > new Date().getFullYear() + 6)) return 'Enter a valid year.';
  if (f.minFrom && values[f.minFrom.key] && v < (values[f.minFrom.key] as string)) return `Can't be before the ${f.minFrom.label}.`;
  return '';
};

/* --------------------------------- View mode -------------------------------- */

const FieldValue: React.FC<{ field: ProfileField; values: ProfileValues }> = ({ field, values }) => {
  const value = values[field.key];
  if (field.type === 'checkbox') {
    return value ? (
      <span className="inline-flex items-center gap-1 mt-0.5 text-[12px] font-semibold text-emerald-600">
        <Check className="w-3.5 h-3.5 stroke-[3]" /> Opted in
      </span>
    ) : (
      <span className="block text-[12px] font-medium text-slate-400 mt-0.5">Not opted</span>
    );
  }
  if (field.type === 'days') {
    const picked = (field.options ?? WEEKDAYS).filter((d) => ((value as string[] | undefined) ?? []).includes(d));
    return picked.length ? (
      <div className="mt-1 flex flex-wrap gap-1.5">
        {picked.map((d) => (
          <span key={d} className="w-11 h-8 rounded-lg bg-[#EFF6FF] text-[#2F68FE] text-[12px] font-bold flex items-center justify-center">
            {d}
          </span>
        ))}
      </div>
    ) : (
      <span className="block text-[12.5px] italic text-slate-400 mt-0.5">{field.emptyText ?? '—'}</span>
    );
  }
  if (field.type === 'slots') {
    const list = (value as string[] | undefined) ?? [];
    return list.length ? (
      <div className="mt-1 flex flex-wrap gap-1.5">
        {slotRanges(list).map((r) => (
          <span key={r} className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2F68FE] text-[11.5px] font-semibold tabular-nums">
            {r}
          </span>
        ))}
      </div>
    ) : (
      <span className="block text-[12.5px] italic text-slate-400 mt-0.5">{field.emptyText ?? '—'}</span>
    );
  }
  if (field.type === 'multiselect') {
    const list = (value as string[] | undefined) ?? [];
    return list.length ? (
      <div className="mt-1 flex flex-wrap gap-1.5">
        {list.map((c) => (
          <span key={c} className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#2F68FE] text-[11.5px] font-semibold">
            {c}
          </span>
        ))}
      </div>
    ) : (
      <span className="block text-[13px] text-slate-300 mt-0.5">—</span>
    );
  }
  if (field.type === 'file' && value) {
    return (
      <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2F68FE] min-w-0">
        <FileText className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{value as string}</span>
      </span>
    );
  }
  const text =
    field.type === 'auto' ? field.compute?.(values) ?? '' : field.type === 'date' ? formatDate(value as string) : (value as string);
  return text ? (
    <span className={`block text-[13px] font-semibold text-[#1E293B] mt-0.5 break-words ${field.type === 'textarea' ? 'font-medium leading-relaxed' : ''}`}>
      {text}
    </span>
  ) : (
    <span className="block text-[13px] text-slate-300 mt-0.5">—</span>
  );
};

/* --------------------------------- Edit mode -------------------------------- */

const inputBase =
  'w-full h-11 px-3.5 bg-white border rounded-xl text-[13px] font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text';

/** Tappable date field that opens the Day / Month / Year wheel sheet */
const DateField: React.FC<{ label: string; value: string; min?: string; error: boolean; onChange: (iso: string) => void }> = ({
  label,
  value,
  min,
  error,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${inputBase} ${error ? 'border-rose-300' : 'border-slate-200'} flex items-center justify-between gap-2 text-left cursor-pointer`}
      >
        <span className={`truncate ${value ? '' : 'text-slate-400'}`}>{value ? formatDate(value) : 'Select date'}</span>
        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      <DateWheelSheet
        isOpen={open}
        title={label}
        value={value}
        min={min}
        max={todayIso()}
        onClose={() => setOpen(false)}
        onApply={(iso) => {
          onChange(iso);
          setOpen(false);
        }}
      />
    </>
  );
};

/** Chips of the current picks; tapping opens the searchable checklist sheet */
const MultiSelectField: React.FC<{ field: ProfileField; value: string[]; error: boolean; onChange: (v: string[]) => void }> = ({
  field,
  value,
  error,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full min-h-11 px-3 py-2 bg-white border rounded-xl flex items-center gap-2 text-left cursor-pointer ${
          error ? 'border-rose-300' : 'border-slate-200'
        }`}
      >
        <span className="flex-1 min-w-0 flex flex-wrap gap-1.5">
          {value.length ? (
            value.map((c) => (
              <span key={c} className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#2F68FE] text-[11.5px] font-semibold">
                {c}
              </span>
            ))
          ) : (
            <span className="text-[13px] font-medium text-slate-400 py-0.5">{field.placeholder ?? 'Select'}</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      <MultiSelectSheet
        isOpen={open}
        title={field.label}
        options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
        selected={value}
        onClose={() => setOpen(false)}
        onApply={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
    </>
  );
};

/** Tappable time field that opens the hour / minute wheel sheet */
const TimeField: React.FC<{ label: string; value: string; error: boolean; onChange: (v: string) => void }> = ({ label, value, error, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${inputBase} ${error ? 'border-rose-300' : 'border-slate-200'} flex items-center justify-between gap-2 text-left tabular-nums cursor-pointer`}
      >
        <span className={value ? '' : 'text-slate-400'}>{value || 'Select time'}</span>
        <Clock3 className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      <TimeWheelSheet
        isOpen={open}
        title={label}
        value={value}
        onClose={() => setOpen(false)}
        onApply={(t) => {
          onChange(t);
          setOpen(false);
        }}
      />
    </>
  );
};

const FieldInput: React.FC<{
  field: ProfileField;
  values: ProfileValues;
  error: string;
  onChange: (v: ProfileValue) => void;
}> = ({ field: f, values, error, onChange }) => {
  const value = values[f.key];
  const border = error ? 'border-rose-300' : 'border-slate-200';

  // State / City: locked until the level above is chosen; a dropdown when we have the list, else free text
  if (f.location === 'state' || f.location === 'city') {
    const country = (values.country as string) || null;
    const state = (values.state as string) || '';
    const parentMissing = f.location === 'state' ? !country : !state.trim();
    if (parentMissing) {
      return (
        <div className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-xs font-medium text-slate-400 truncate">
          {f.location === 'state' ? 'Select country first' : 'Select state first'}
        </div>
      );
    }
    const list = f.location === 'state' ? statesOf(country) : citiesOf(country, state);
    if (list) {
      return <Dropdown ariaLabel={f.label} value={(value as string) || null} placeholder="Select" options={list} onChange={onChange} />;
    }
  }

  if (isReadOnly(f)) {
    const text =
      f.type === 'auto'
        ? f.compute?.(values)
        : f.type === 'date'
          ? formatDate(value as string)
          : Array.isArray(value)
            ? value.join(', ')
            : (value as string);
    return (
      <div className="h-11 px-3.5 rounded-xl bg-slate-100/70 border border-slate-200/70 flex items-center text-[13px] font-medium text-slate-500">
        <span className="truncate">{text || '—'}</span>
      </div>
    );
  }
  switch (f.type) {
    case 'select':
      return (
        <Dropdown
          ariaLabel={f.label}
          value={(value as string) || null}
          placeholder="Select"
          // Clearable: once something is chosen, "— Select —" at the top undoes it
          options={f.clearable && value ? [{ value: '', label: '— Select —' }, ...(f.options ?? []).map((o) => ({ value: o, label: o }))] : f.options ?? []}
          onChange={onChange}
        />
      );
    case 'toggle':
      return (
        <div role="radiogroup" aria-label={f.label} className={`h-11 p-1 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 border ${error ? 'border-rose-300' : 'border-transparent'}`}>
          {(f.options ?? []).map((o) => {
            const on = value === o;
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(o)}
                className={`rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  on ? 'bg-white text-[#2F68FE] shadow-[0_1px_3px_rgba(15,23,42,0.12)]' : 'text-slate-500'
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    case 'radio':
      return (
        <div className={(f.options?.length ?? 0) === 2 ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'} role="radiogroup" aria-label={f.label}>
          {(f.options ?? []).map((o) => {
            const on = value === o;
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(o)}
                className={`h-11 px-3 flex items-center gap-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  on ? 'border-[#2F68FE] bg-blue-50/60 text-[#1E293B]' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${on ? 'border-[#2F68FE]' : 'border-slate-300'}`}>
                  {on && <span className="w-2 h-2 rounded-full bg-[#2F68FE]" />}
                </span>
                {o}
              </button>
            );
          })}
        </div>
      );
    case 'checkbox':
      return (
        <button
          type="button"
          role="checkbox"
          aria-checked={Boolean(value)}
          onClick={() => onChange(!value)}
          className="h-9 flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer"
        >
          <span
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
              value ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
            }`}
          >
            {value && <Check className="w-3 h-3 stroke-[3]" />}
          </span>
          {f.checkboxText ?? f.label}
        </button>
      );
    case 'date':
      return (
        <DateField
          label={f.label}
          value={(value as string) ?? ''}
          min={f.minFrom ? (values[f.minFrom.key] as string) || undefined : undefined}
          error={Boolean(error)}
          onChange={onChange}
        />
      );
    case 'file':
      // Same upload UI as the rest of the app
      return <FileUploadField fileName={(value as string) || null} onChange={(name) => onChange(name ?? '')} label={`Upload ${f.label}`} sheetTitle={f.label} maxSizeMB={10} />;
    case 'days': {
      const days = f.options ?? WEEKDAYS;
      const picked = (value as string[]) ?? [];
      const all = days.every((d) => picked.includes(d));
      const chip = (on: boolean) =>
        `h-11 rounded-xl border text-[11.5px] font-bold transition-colors cursor-pointer ${
          on ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'
        }`;
      return (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${days.length + 1}, minmax(0, 1fr))` }} role="group" aria-label={f.label}>
          <button type="button" aria-pressed={all} onClick={() => onChange(all ? [] : [...days])} className={chip(all)}>
            All
          </button>
          {days.map((d) => {
            const on = picked.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(days.filter((x) => (x === d ? !on : picked.includes(x))))}
                className={chip(on)}
              >
                {d}
              </button>
            );
          })}
        </div>
      );
    }
    case 'slots': {
      const slots = f.options ?? [];
      const picked = (value as string[]) ?? [];
      const all = slots.length > 0 && slots.every((x) => picked.includes(x));
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {picked.length ? `${picked.length} of ${slots.length} selected` : 'Tap the hours you can take interviews'}
            </span>
            <button
              type="button"
              onClick={() => onChange(all ? [] : [...slots])}
              className="text-[11px] font-bold text-[#2F68FE] cursor-pointer"
            >
              {all ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={f.label}>
            {slots.map((slot) => {
              const on = picked.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(slots.filter((x) => (x === slot ? !on : picked.includes(x))))}
                  className={`h-10 rounded-xl border flex items-center justify-center text-[12px] font-semibold tabular-nums transition-colors cursor-pointer ${
                    on ? 'border-[#2F68FE] bg-blue-50 text-[#2F68FE]' : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
                  }`}
                >
                  {slotShort(slot)}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    case 'time':
      return <TimeField label={f.label} value={(value as string) ?? ''} error={Boolean(error)} onChange={onChange} />;
    case 'multiselect':
      return <MultiSelectField field={f} value={(value as string[]) ?? []} error={Boolean(error)} onChange={onChange} />;
    case 'textarea':
      return (
        <textarea
          rows={4}
          value={(value as string) ?? ''}
          maxLength={1000}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your key responsibilities..."
          className={`w-full p-3.5 bg-white border rounded-xl text-[13px] font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text ${border}`}
        />
      );
    default: {
      const numeric = f.type === 'tel' || f.type === 'number' || f.type === 'year' || Boolean(f.digitsOnly);
      return (
        <input
          type={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
          inputMode={numeric ? 'numeric' : undefined}
          maxLength={f.type === 'tel' ? 10 : f.type === 'year' ? 4 : undefined}
          value={(value as string) ?? ''}
          placeholder={f.placeholder ?? (f.type === 'year' ? 'YYYY' : undefined)}
          onChange={(e) => onChange(numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
          className={`${inputBase} ${border}`}
        />
      );
    }
  }
};

/** 2-column grid of fields (view or edit), with Father / Mother style sub-groups */
/** Profile value key holding a family member's qualifications & certificates (JSON) */
const qualKey = (group: string) => `qual${group}`;
/** Family member's "Add Qualification & Certificate" (edit) / summary line (view), opening the Qualification sheet */
const QualificationCTA: React.FC<{ raw: ProfileValue | undefined; editing: boolean; onOpen: () => void; className?: string }> = ({
  raw,
  editing,
  onOpen,
  className = '',
}) => {
  const data = parseQualificationData(raw);
  const nq = data.qualifications.length;
  const nc = data.certifications.length;
  const summary = [nq && `${nq} ${nq === 1 ? 'qualification' : 'qualifications'}`, nc && `${nc} ${nc === 1 ? 'certificate' : 'certificates'}`]
    .filter(Boolean)
    .join(' · ');
  if (!editing && !summary) return null;
  return (
    <div className={className}>
      {editing ? (
        <button
          type="button"
          onClick={onOpen}
          className={`w-full min-h-11 px-3 py-2 rounded-xl border flex items-center gap-2.5 text-left cursor-pointer ${
            summary ? 'border-slate-200 bg-slate-50 active:bg-slate-100' : 'border-dashed border-[#2F68FE]/50 bg-blue-50/40 active:bg-blue-50'
          }`}
        >
          <GraduationCap className="w-4.5 h-4.5 text-[#2F68FE] shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-[#2F68FE]">{summary ? 'Qualification & Certificate' : 'Add Qualification & Certificate'}</span>
            {summary && <span className="block text-[10.5px] text-slate-500 truncate">{summary}</span>}
          </span>
          {summary ? <Pencil className="w-3.5 h-3.5 text-[#2F68FE] shrink-0" /> : <Plus className="w-4 h-4 text-[#2F68FE] shrink-0" />}
        </button>
      ) : (
        <p className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
          <GraduationCap className="w-4 h-4 text-[#2F68FE] shrink-0" />
          <span className="font-semibold text-[#1E293B]">Qualification &amp; Certificate</span>
          <span className="ml-auto truncate">{summary}</span>
        </p>
      )}
    </div>
  );
};

/** List items (e.g. Family Members) keep their qualifications under this key */
const MEMBER_QUAL_KEY = 'qualifications';
/** `qualFor` value meaning "this list item" rather than a Father / Mother / Guardian group */
const THIS_MEMBER = '__member__';

/** Groups that are family members (get the insurance option and Qualification & Certificate) */
const FAMILY_GROUPS = ['Father', 'Mother', 'Guardian'];
const FieldGrid: React.FC<{
  fields: ProfileField[];
  values: ProfileValues;
  editing: boolean;
  errors: Record<string, string>;
  errorKey: (fieldKey: string) => string;
  onChange: (fieldKey: string, v: ProfileValue) => void;
  /** List item that is a person: adds their Qualification & Certificate (subtitle like "Sister · Emma Smith") */
  memberQualification?: { subtitle: string };
}> = ({ fields, values, editing, errors, errorKey, onChange, memberQualification }) => {
  // Which family member's Qualification & Certificate sheet is open
  const [qualFor, setQualFor] = useState<string | null>(null);
  // e.g. "Robert Smith": the group's Full Name, shown under the sheet title
  const memberName = (group: string) => {
    const nameField = fields.find((x) => x.group === group && x.label === 'Full Name');
    return nameField ? String(values[nameField.key] ?? '') : '';
  };
  // Where the open sheet reads / saves: this list item, or a Father / Mother / Guardian group
  const qualTarget = (q: string) =>
    q === THIS_MEMBER && memberQualification
      ? { key: MEMBER_QUAL_KEY, subtitle: memberQualification.subtitle }
      : { key: qualKey(q), subtitle: [q, memberName(q)].filter(Boolean).join(' · ') };
  const gap = editing ? 'gap-x-3 gap-y-3.5' : 'gap-x-4 gap-y-3.5';
  // Country → State → City: a new Country clears State and City, a new State clears City
  const changeWithCascade = (f: ProfileField, v: ProfileValue) => {
    const changed = values[f.key] !== v;
    onChange(f.key, v);
    if (!changed) return;
    const below = f.location === 'country' ? ['state', 'city'] : f.location === 'state' ? ['city'] : [];
    below.forEach((loc) => {
      const dep = fields.find((x) => x.location === loc);
      if (dep && values[dep.key]) onChange(dep.key, '');
    });
    // Defaults that come with a choice (e.g. pursuing CPA → Regime "Old"), only where nothing is set yet
    if (f.fills && v === f.fills.when) {
      Object.entries(f.fills.values).forEach(([k, val]) => {
        if (!values[k]) onChange(k, val);
      });
    }
    // Explicit dependents (e.g. a new CPA regime empties BEC and the BAR / TCP / ISC choice)
    f.clears?.forEach((k) => {
      const dep = fields.find((x) => x.key === k);
      if (values[k]) onChange(k, dep?.type === 'checkbox' ? false : '');
    });
  };
  const render = (f: ProfileField) => {
    if (f.question) {
      const key = errorKey(f.key);
      const answer = values[f.key] as string;
      const fu = f.followUp;
      const fuKey = fu ? errorKey(fu.key) : '';
      const fuValue = fu ? ((values[fu.key] as string) ?? '') : '';
      const showFollowUp = Boolean(fu) && answer === 'Yes';
      return (
        <div key={f.key} data-field={key} className="col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[13px] font-bold text-[#1E293B]">{f.label}</span>
            {!editing && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                  answer === 'Yes'
                    ? 'bg-emerald-50 text-emerald-600'
                    : answer === 'No'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-white border border-slate-200 text-slate-400'
                }`}
              >
                {answer || 'Not answered'}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11.5px] text-slate-500 leading-relaxed">{f.question}</p>

          {!editing && showFollowUp && fuValue && (
            <p className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-100 text-[11px] text-slate-500">
              Applies: <span className="font-bold text-[#1E293B]">{fuValue}</span>
            </p>
          )}

          {editing && (
            <div className="mt-2.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label={f.label}>
              {(f.options ?? []).map((o) => {
                const on = answer === o;
                const yes = o === 'Yes';
                return (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      onChange(f.key, o);
                      // A "No" answer makes the follow-up irrelevant
                      if (fu && o !== 'Yes' && fuValue) onChange(fu.key, '');
                    }}
                    className={`h-10 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      on
                        ? yes
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-rose-300 bg-rose-50 text-rose-600'
                        : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
                    }`}
                  >
                    {yes ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
                    {o}
                  </button>
                );
              })}
            </div>
          )}

          {editing && showFollowUp && fu && (
            <div data-field={fuKey} className="mt-3 pt-3 border-t border-dashed border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                {fu.label} <span className="text-rose-500">*</span>
              </p>
              <div className="space-y-1.5" role="radiogroup" aria-label={fu.label}>
                {fu.options.map((opt) => {
                  const on = fuValue === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => onChange(fu.key, opt.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border flex items-center gap-3 text-left transition-colors cursor-pointer ${
                        on ? 'border-[#2F68FE] bg-blue-50/60' : `bg-white active:bg-slate-50 ${errors[fuKey] ? 'border-rose-200' : 'border-slate-200'}`
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-[#2F68FE]' : 'border-slate-300'}`}>
                        {on && <span className="w-2 h-2 rounded-full bg-[#2F68FE]" />}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[12.5px] font-bold ${on ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}>{opt.value}</span>
                        <span className="block text-[11px] text-slate-500">{opt.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors[fuKey] && <p className="mt-1.5 px-0.5 text-[11px] font-medium text-rose-500">{errors[fuKey]}</p>}
            </div>
          )}
        </div>
      );
    }
    if (!editing) {
      return (
        <div key={f.key} className={isWide(f) || f.type === 'textarea' || f.type === 'file' ? 'col-span-2' : 'min-w-0'}>
          <span className="block text-[11px] font-medium text-slate-500 leading-snug">{f.label}</span>
          <FieldValue field={f} values={values} />
          {f.hint && <span className="block text-[10.5px] text-slate-400 mt-0.5">{f.hint}</span>}
        </div>
      );
    }
    const key = errorKey(f.key);
    const error = errors[key] ?? '';

    // Exam parts as full-width cards: a checkbox (e.g. "I have cleared Part 1 …") or a dropdown (the CPA
    // BAR / TCP / ISC discipline). The linked Date of Completion opens inside the same card once it's ticked
    // or chosen, so the two clearly belong together.
    const detail = fields.find((x) => x.detailOf === f.key);
    if ((f.type === 'checkbox' && !f.inHeader) || detail) {
      const on = Boolean(values[f.key]);
      const detailKey = detail ? errorKey(detail.key) : '';
      const isCheckbox = f.type === 'checkbox';
      return (
        <div
          key={f.key}
          data-field={key}
          className={`col-span-2 rounded-xl border transition-colors ${on ? 'border-[#2F68FE]/40 bg-blue-50/50' : 'border-slate-200 bg-white'}`}
        >
          {isCheckbox ? (
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => changeWithCascade(f, !on)}
              className="w-full flex items-start gap-3 p-3 text-left cursor-pointer"
            >
              <span
                className={`mt-px w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  on ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
                }`}
                aria-hidden="true"
              >
                {on && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className={`flex-1 min-w-0 text-[12px] leading-snug ${on ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-700'}`}>
                {f.checkboxText ?? f.label}
              </span>
            </button>
          ) : (
            <div className="p-3 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-600">
                {f.editLabel ?? f.label}
                {f.required && <span className="text-rose-500"> *</span>}
              </label>
              <FieldInput field={f} values={values} error={error} onChange={(v) => changeWithCascade(f, v)} />
              {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
            </div>
          )}
          {on && detail && (
            <div data-field={detailKey} className={`px-3 pb-3 space-y-1.5 animate-in fade-in duration-200 ${isCheckbox ? 'pl-11' : ''}`}>
              <label className="block text-[11px] font-semibold text-slate-600">
                {detail.editLabel ?? detail.label}
                {detail.required && <span className="text-rose-500"> *</span>}
              </label>
              <FieldInput
                field={detail}
                values={values}
                error={errors[detailKey] ?? ''}
                onChange={(v) => changeWithCascade(detail, v)}
              />
              {errors[detailKey] && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors[detailKey]}</p>}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={f.key} data-field={key} className={`space-y-1.5 ${isWide(f) ? 'col-span-2' : 'min-w-0'}`}>
        {f.type !== 'checkbox' && (
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 min-w-0">
            {/* Labels stay on one line so the inputs in a row line up */}
            <span className="leading-snug truncate" title={f.editLabel ?? f.label}>
              {f.editLabel ?? f.label}
              {f.required && !isReadOnly(f) && <span className="text-rose-500"> *</span>}
            </span>
          </label>
        )}
        <FieldInput field={f} values={values} error={error} onChange={(v) => changeWithCascade(f, v)} />
        {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
      </div>
    );
  };

  return (
    <>
    <div className={`grid grid-cols-2 items-start ${gap}`}>
      {groupRuns(visibleFields(fields, values).filter((x) => (editing || !x.editOnly) && !x.detailOf)).map((run, i) =>
        run.group ? (
          // Each group (Father, Mother…) is its own card so the people are easy to tell apart (view and edit)
          <div key={`run-${i}`} className="col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
              <span className="w-7 h-7 rounded-full bg-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0">
                {FAMILY_GROUPS.includes(run.group) ? <User className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
              </span>
              <span className="flex-1 min-w-0 text-[13px] font-bold text-[#1E293B] truncate">{run.group}</span>
              {/* Yes/no options (e.g. insurance) sit on the right of the person's header */}
              {run.fields
                .filter((f) => f.type === 'checkbox' && f.inHeader)
                .map((f) => {
                  const on = Boolean(values[f.key]);
                  return editing ? (
                    <button
                      key={f.key}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => onChange(f.key, !on)}
                      className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <span
                        className={`w-4.5 h-4.5 rounded-[5px] border-2 flex items-center justify-center ${
                          on ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {on && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      {f.checkboxText ?? f.label}
                    </button>
                  ) : (
                    <span
                      key={f.key}
                      className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        on ? 'bg-emerald-50 text-emerald-600' : 'bg-white border border-slate-200 text-slate-400'
                      }`}
                    >
                      {on && <Check className="w-3 h-3 stroke-[3]" />}
                      {f.label} {on ? 'opted in' : 'not opted'}
                    </span>
                  );
                })}
            </div>
            <div className={`grid grid-cols-2 items-start p-3.5 ${gap}`}>{run.fields.filter((f) => !(f.type === 'checkbox' && f.inHeader)).map(render)}</div>
            {/* Family member's qualifications & certificates (edited in a sheet, saved with the profile draft) */}
            {FAMILY_GROUPS.includes(run.group) && (
              <QualificationCTA raw={values[qualKey(run.group)]} editing={editing} onOpen={() => setQualFor(run.group ?? null)} className="px-3.5 pb-3.5" />
            )}
          </div>
        ) : (
          <React.Fragment key={`run-${i}`}>{run.fields.map(render)}</React.Fragment>
        )
      )}
      {/* A list item (e.g. a family member): its own Qualification & Certificate */}
      {memberQualification && (
        <QualificationCTA raw={values[MEMBER_QUAL_KEY]} editing={editing} onOpen={() => setQualFor(THIS_MEMBER)} className="col-span-2" />
      )}
    </div>
    <QualificationSheet
      isOpen={Boolean(qualFor)}
      subtitle={qualFor ? qualTarget(qualFor).subtitle : ''}
      initial={parseQualificationData(qualFor ? values[qualTarget(qualFor).key] : '')}
      onClose={() => setQualFor(null)}
      onSave={(data) => {
        if (qualFor) onChange(qualTarget(qualFor).key, JSON.stringify(data));
        setQualFor(null);
      }}
    />
    </>
  );
};

/* ------------------------------- List sections ------------------------------ */

const listErrorKey = (listKey: string, id: string, field: string) => `${listKey}-${id}-${field}`;

// Academic Qualification rows ↔ the sheet's model (the row keeps the upload under "certificate")
const str = (v: ProfileValue | undefined) => (typeof v === 'string' ? v : '');
const listItemToQualification = (it: ProfileListItem): Qualification => ({
  id: it.id,
  education: str(it.education) || null,
  subject: str(it.subject) || null,
  school: str(it.school),
  board: str(it.board),
  country: str(it.country) || null,
  state: str(it.state),
  city: str(it.city),
  year: str(it.year),
  file: str(it.certificate) || null,
});
const qualificationToListItem = (q: Qualification): ProfileListItem => ({
  id: `qualifications-${q.id}`,
  education: q.education ?? '',
  subject: q.subject ?? '',
  school: q.school,
  board: q.board,
  country: q.country ?? '',
  state: q.state,
  city: q.city,
  year: q.year,
  certificate: q.file ?? '',
});

const ListSection: React.FC<{
  title: string;
  config: ProfileListConfig;
  items: ProfileListItem[];
  editing: boolean;
  errors: Record<string, string>;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, key: string, value: ProfileValue) => void;
  /** Inside another section's card (e.g. Family Members under Family Details): no card of its own, a subheading instead */
  embedded?: boolean;
  /** Each item is a person: give them Qualification & Certificate */
  qualifications?: boolean;
  /** For lists edited in a sheet (config.sheet): open an entry */
  onEditItem?: (id: string) => void;
}> = ({ title, config, items, editing, errors, onAdd, onRemove, onChange, embedded = false, qualifications = false, onEditItem }) => {
  const stats = config.summary?.(items);
  // Sheet-edited lists show entries read-only, with Edit / Remove on each
  const inSheet = Boolean(config.sheet);
  return (
    // Embedded (Family Members): no heading or divider, the member cards just continue the card, with "Add Family Member" at the end
    <section className={embedded ? 'mt-3' : 'bg-white rounded-2xl border border-slate-100 shadow-2xs p-4'}>
      {!embedded && (
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
        <h3 className="text-[13px] font-bold text-[#1E293B]">
          {title}
          {items.length > 1 && <span className="ml-1.5 text-slate-400 font-semibold">({items.length})</span>}
        </h3>
        {editing && (
          <button
            type="button"
            onClick={onAdd}
            className="h-8 px-2.5 -my-1 rounded-lg border border-[#2F68FE]/30 text-[#2F68FE] text-[11px] font-bold flex items-center gap-1 active:bg-blue-50 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {config.addLabel}
          </button>
        )}
      </div>
      )}

      {stats && items.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border px-3 py-2.5 ${s.highlight ? 'col-span-2 bg-blue-50/60 border-blue-100' : 'bg-slate-50/70 border-slate-100'}`}
            >
              <span className="block text-[10.5px] text-slate-500">{s.label}</span>
              <span className={`block text-[13px] font-bold tabular-nums ${s.highlight ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !embedded ? (
        <div className="py-5 flex flex-col items-center text-center">
          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </span>
          <p className="mt-2 text-xs font-semibold text-slate-600">{config.emptyText}</p>
          <p className="text-[11px] text-slate-400">{editing ? `Tap ${config.addLabel} to get started.` : 'Tap Edit to add one.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const isNew = Boolean(item[NEW_FLAG]);
            // The entry's first field (e.g. the member's name) identifies it in the header
            const first = config.fields[0];
            const lead = first && typeof item[first.key] === 'string' ? (item[first.key] as string).trim() : '';
            return (
              // Each entry is its own card so where one ends and the next begins is obvious
              <div
                key={item.id}
                data-item={item.id}
                className={`rounded-2xl border overflow-hidden ${isNew ? 'border-[#2F68FE]/40 ring-2 ring-[#2F68FE]/10' : 'border-slate-200'}`}
              >
                <div className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b ${isNew ? 'bg-blue-50/70 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isNew ? 'bg-[#2F68FE] text-white' : 'bg-blue-100 text-[#2F68FE]'
                    }`}
                  >
                    {isNew ? <Plus className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold text-[#1E293B] truncate">
                      {isNew ? `New ${config.itemLabel.toLowerCase()}` : lead || `${config.itemLabel} ${i + 1}`}
                    </span>
                    {!isNew && lead && <span className="block text-[10.5px] text-slate-500">{`${config.itemLabel} ${i + 1}`}</span>}
                  </span>
                  {editing && inSheet && (
                    <button
                      type="button"
                      onClick={() => onEditItem?.(item.id)}
                      className="h-8 px-2 rounded-lg flex items-center gap-1 text-[11px] font-semibold text-[#2F68FE] active:bg-blue-50 cursor-pointer shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="h-8 -mr-1 px-2 rounded-lg flex items-center gap-1 text-[11px] font-semibold text-rose-500 active:bg-rose-50 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
                <div className="p-3.5 bg-white">
                  <FieldGrid
                    fields={config.fields}
                    values={item}
                    editing={editing && !inSheet}
                    errors={errors}
                    errorKey={(k) => listErrorKey(config.key, item.id, k)}
                    onChange={(k, v) => onChange(item.id, k, v)}
                    memberQualification={
                      qualifications
                        ? { subtitle: [item.relation, item.name].filter(Boolean).join(' · ') || `${config.itemLabel} ${i + 1}` }
                        : undefined
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {embedded && editing && (
        <button
          type="button"
          onClick={onAdd}
          className={`w-full p-3.5 rounded-2xl border border-dashed border-[#2F68FE]/40 bg-linear-to-br from-[#EEF4FF] to-white flex items-center gap-3 text-left active:scale-[0.99] transition-transform cursor-pointer ${
            items.length ? 'mt-3' : ''
          }`}
        >
          <span className="w-10 h-10 rounded-xl bg-[#2F68FE] text-white flex items-center justify-center shrink-0 shadow-sm">
            <UserPlus className="w-5 h-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-[#1E293B]">{config.addLabel}</span>
            <span className="block text-[11px] text-slate-500 leading-snug">
              {items.length ? `${items.length} added · add another` : 'Siblings, in-laws, cousins or friends'}
            </span>
          </span>
          <Plus className="w-5 h-5 text-[#2F68FE] shrink-0" />
        </button>
      )}
    </section>
  );
};

/* ------------------------------ List entry sheet ------------------------------ */

const ENTRY_SHEET_ICONS: Record<string, React.ReactNode> = {
  experiences: <BriefcaseBusiness className="w-5 h-5" />,
};

/**
 * Add / edit a list's entries in a bottom sheet (config.sheet === 'form', e.g. Experience).
 * "Add" lands straight on a blank form; "Add another" stacks more as an accordion where only one is open.
 */
const ListEntrySheet: React.FC<{
  config: ProfileListConfig;
  isOpen: boolean;
  /** The entry being edited; none = adding new ones */
  editing: ProfileListItem | null;
  onClose: () => void;
  onSave: (entries: ProfileListItem[]) => void;
}> = ({ config, isOpen, editing, onClose, onSave }) => {
  const [entries, setEntries] = useState<ProfileListItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Fixed when the sheet opens so the title doesn't flip while it slides away
  const [isEdit, setIsEdit] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const noun = config.itemLabel.toLowerCase();

  const blank = (): ProfileListItem => ({ id: `${config.key}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });

  useEffect(() => {
    if (!isOpen) return;
    const first = editing ? { ...editing } : blank();
    setIsEdit(Boolean(editing));
    setEntries([first]);
    setOpenId(first.id);
    setErrors({});
    bodyRef.current?.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const reveal = (id: string) =>
    requestAnimationFrame(() => bodyRef.current?.querySelector(`[data-entry="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  // FieldGrid can fire several changes at once (location cascade), so update functionally
  const patch = (id: string, key: string, value: ProfileValue) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [key]: value } : e)));
    setErrors((prev) => {
      const k = listErrorKey(config.key, id, key);
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };
  const addAnother = () => {
    const e = blank();
    setEntries((prev) => [...prev, e]);
    setOpenId(e.id);
    reveal(e.id);
  };
  const toggle = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
    if (openId !== id) reveal(id);
  };
  const remove = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    if (openId === id) setOpenId(next[next.length - 1]?.id ?? null);
  };

  const started = (e: ProfileListItem) =>
    Object.entries(e).some(([k, v]) => k !== 'id' && (Array.isArray(v) ? v.length > 0 : Boolean(v)));
  const hasError = (id: string) => Object.keys(errors).some((k) => k.startsWith(listErrorKey(config.key, id, '')) && errors[k]);

  const save = () => {
    // Extra entries left blank are dropped; if nothing was filled, the first one asks for its required fields
    const filled = entries.filter(started);
    const toCheck = filled.length ? filled : entries.slice(0, 1);
    const found: Record<string, string> = {};
    toCheck.forEach((e) =>
      visibleFields(config.fields, e).forEach((f) => {
        const msg = validate(f, e);
        if (msg) found[listErrorKey(config.key, e.id, f.key)] = msg;
      })
    );
    setErrors(found);
    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      const bad = toCheck.find((e) => firstKey.startsWith(listErrorKey(config.key, e.id, '')));
      if (bad) setOpenId(bad.id);
      setTimeout(() => bodyRef.current?.querySelector(`[data-field="${firstKey}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
      return;
    }
    onSave(filled);
  };

  const count = entries.filter(started).length;
  const grid = (e: ProfileListItem) => (
    <FieldGrid
      fields={config.fields}
      values={e}
      editing
      errors={errors}
      errorKey={(k) => listErrorKey(config.key, e.id, k)}
      onChange={(k, v) => patch(e.id, k, v)}
    />
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[94%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-[#2F68FE] text-white flex items-center justify-center shrink-0 shadow-sm">
            {ENTRY_SHEET_ICONS[config.key] ?? <FileText className="w-5 h-5" />}
          </span>
          <h2 className="text-base font-bold text-[#1E293B] truncate">{isEdit ? `Edit ${config.itemLabel}` : config.addLabel}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4 space-y-3 bg-[#F8FAFC]">
        {entries.map((e, i) => {
          if (entries.length === 1)
            // A single entry needs no card chrome: just the form
            return (
              <div key={e.id} data-entry={e.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
                {grid(e)}
              </div>
            );
          // Several: an accordion, only the one being filled is open
          const open = openId === e.id;
          const bad = hasError(e.id);
          const lead = config.entryTitle?.(e) || `${config.itemLabel} ${i + 1}`;
          const summary = config.entrySummary?.(e) || (started(e) ? 'In progress' : 'Not filled yet');
          return (
            <div
              key={e.id}
              data-entry={e.id}
              className={`rounded-xl border bg-white overflow-hidden scroll-mt-2 ${
                bad ? 'border-rose-300' : open ? 'border-[#2F68FE]/40 ring-2 ring-[#2F68FE]/10' : 'border-slate-200'
              }`}
            >
              <div className={`flex items-center gap-2.5 pl-3.5 pr-2 py-2.5 ${open ? 'bg-blue-50/60 border-b border-blue-100' : ''}`}>
                <button type="button" onClick={() => toggle(e.id)} className="flex-1 min-w-0 flex items-center gap-2.5 text-left cursor-pointer">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      bad ? 'bg-rose-100 text-rose-500' : open ? 'bg-[#2F68FE] text-white' : 'bg-blue-100 text-[#2F68FE]'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold text-[#1E293B] truncate">{lead}</span>
                    <span className={`block text-[11px] truncate ${bad ? 'text-rose-500 font-medium' : 'text-slate-500'}`}>
                      {bad ? 'Needs attention' : summary}
                    </span>
                  </span>
                  <ChevronDown className={`w-4.5 h-4.5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(e.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 active:bg-rose-50 cursor-pointer shrink-0"
                  aria-label={`Delete ${noun} ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {open && <div className="p-3.5 animate-in fade-in duration-200">{grid(e)}</div>}
            </div>
          );
        })}
        {!isEdit && (
          <button
            type="button"
            onClick={addAnother}
            className="w-full h-11 rounded-xl border border-dashed border-[#2F68FE]/40 bg-white flex items-center justify-center gap-1.5 text-xs font-bold text-[#2F68FE] active:bg-[#EEF4FF] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add another {noun}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0 bg-white">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          {isEdit ? 'Save Changes' : count > 1 ? `${config.addLabel.replace(/^Add /, 'Add ' + count + ' ')}s` : config.addLabel}
        </button>
      </div>
    </BottomSheet>
  );
};

/* ------------------------------- Skills sections ----------------------------- */

/** Read-only strength meter for view mode */
const LevelBars: React.FC<{ value: string }> = ({ value }) => {
  const idx = PROFICIENCY_LEVELS.indexOf(value);
  return (
    <span className="flex items-center gap-0.5" aria-label={value || 'Not rated'}>
      {PROFICIENCY_LEVELS.map((l, i) => (
        <span key={l} className={`w-2.5 h-1.5 rounded-full ${i <= idx ? 'bg-[#2F68FE]' : 'bg-slate-200'}`} />
      ))}
    </span>
  );
};

/** Labelled level chips — one tap picks the proficiency */
const LevelChips: React.FC<{ value: string; onChange: (level: string) => void; missing?: boolean }> = ({ value, onChange, missing }) => (
  <div role="radiogroup" aria-label="Proficiency" className="flex flex-wrap gap-1.5">
    {PROFICIENCY_LEVELS.map((l) => {
      const on = value === l;
      return (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={on}
          onClick={() => onChange(l)}
          className={`h-8 px-3 rounded-full border text-[11.5px] font-semibold transition-colors cursor-pointer ${
            on
              ? 'bg-[#2F68FE] border-[#2F68FE] text-white shadow-[0_4px_10px_-4px_rgba(47,104,254,0.6)]'
              : `bg-white text-slate-600 active:bg-slate-50 ${missing ? 'border-amber-200' : 'border-slate-200'}`
          }`}
        >
          {l}
        </button>
      );
    })}
  </div>
);

const SkillsSection: React.FC<{
  title: string;
  config: ProfileSkillsConfig;
  items: ProfileListItem[];
  editing: boolean;
  onChange: (items: ProfileListItem[]) => void;
}> = ({ title, config, items, editing, onChange }) => {
  const [picking, setPicking] = useState(false);
  const categoryOf = (name: string) => config.options.find((o) => o.name === name)?.category;

  const applyPicks = (names: string[]) => {
    // Keep existing ratings; new picks start unrated
    const kept = items.filter((it) => names.includes(it.name as string));
    const added = names
      .filter((n) => !items.some((it) => it.name === n))
      .map((n, i) => ({ id: `${config.key}-${Date.now()}-${i}`, name: n, category: categoryOf(n) ?? '', level: '' }));
    onChange([...kept, ...added]);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4">
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
        <h3 className="text-[13px] font-bold text-[#1E293B]">
          {title}
          {items.length > 1 && <span className="ml-1.5 text-slate-400 font-semibold">({items.length})</span>}
        </h3>
        {editing && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="h-8 px-2.5 -my-1 rounded-lg border border-[#2F68FE]/30 text-[#2F68FE] text-[11px] font-bold flex items-center gap-1 active:bg-blue-50 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {config.addLabel}
          </button>
        )}
      </div>

      {editing && items.length > 0 && (
        <p className="mb-3 text-[11px] text-slate-400">Choose your proficiency level for each {config.noun}.</p>
      )}

      {items.length === 0 ? (
        <div className="py-5 flex flex-col items-center text-center">
          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </span>
          <p className="mt-2 text-xs font-semibold text-slate-600">{config.emptyText}</p>
          <p className="text-[11px] text-slate-400">
            {editing ? `Tap ${config.addLabel} to pick from the master list.` : 'Tap Edit to add from the master list.'}
          </p>
        </div>
      ) : (
        <ul className={editing ? 'space-y-2.5' : 'divide-y divide-slate-100 -my-1'}>
          {items.map((it) =>
            editing ? (
              <li key={it.id} className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 pt-2.5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-[#1E293B] truncate">{it.name as string}</span>
                    {it.category && <span className="block text-[10.5px] text-slate-400">{it.category as string} Software</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((x) => x.id !== it.id))}
                    className="w-8 h-8 -mr-1.5 rounded-lg flex items-center justify-center text-rose-500 active:bg-rose-50 cursor-pointer shrink-0"
                    aria-label={`Remove ${it.name as string}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className={`mt-2 mb-1.5 text-[10.5px] font-semibold ${it.level ? 'text-slate-500' : 'text-amber-600'}`}>
                  {it.level ? 'Proficiency' : 'Select your proficiency'}
                </p>
                <LevelChips
                  value={(it.level as string) ?? ''}
                  missing={!it.level}
                  onChange={(level) => onChange(items.map((x) => (x.id === it.id ? { ...x, level } : x)))}
                />
              </li>
            ) : (
              <li key={it.id} className="py-2.5 first:pt-1 last:pb-1 flex items-center gap-3">
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-[#1E293B] truncate">{it.name as string}</span>
                  {it.category && <span className="block text-[10.5px] text-slate-400">{it.category as string} Software</span>}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                    it.level ? 'bg-blue-50 text-[#2F68FE]' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {(it.level as string) || 'Not rated'}
                </span>
              </li>
            )
          )}
        </ul>
      )}

      <MultiSelectSheet
        isOpen={picking}
        title={config.addLabel}
        searchPlaceholder={`Search ${config.noun}…`}
        options={config.options.map((o) => ({ value: o.name, label: o.name, badge: o.category }))}
        selected={items.map((it) => it.name as string)}
        onClose={() => setPicking(false)}
        onApply={(names) => {
          applyPicks(names);
          setPicking(false);
        }}
      />
    </section>
  );
};

/* ---------------------------------- Screen ---------------------------------- */

export const MyProfileView: React.FC<MyProfileViewProps> = ({ profile, photoUrl, title = 'My Profile', startEditing, onBack, onSave, onNotify, onDirtyChange }) => {
  const [tab, setTab] = useState<ProfileTabId>('personal');
  const [editing, setEditing] = useState(Boolean(startEditing));
  const [draft, setDraft] = useState<MyProfileData>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState<null | 'back' | 'cancel' | { tab: ProfileTabId }>(null);
  const [scrollToItem, setScrollToItem] = useState<string | null>(null);
  // Academic Qualification: add several / edit one in a sheet (editId null = adding)
  const [qualSheet, setQualSheet] = useState<{ listKey: string; editId: string | null } | null>(null);
  // Experience: same idea with the list's own fields (kept after closing so the sheet can slide away)
  const [entrySheet, setEntrySheet] = useState<{ config: ProfileListConfig; editId: string | null; open: boolean } | null>(null);
  /** Add (id null) or edit an entry of a list: in its sheet, or inline for lists without one */
  const openEntry = (config: ProfileListConfig, id: string | null) => {
    if (config.sheet === 'qualification') setQualSheet({ listKey: config.key, editId: id });
    else if (config.sheet === 'form') setEntrySheet({ config, editId: id, open: true });
    else addItem(config);
  };
  const tabRefs = useRef<Partial<Record<ProfileTabId, HTMLButtonElement | null>>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  // Tabs are transparent at rest; once pinned to the top they get a backdrop so content doesn't show through
  const tabsSentinelRef = useRef<HTMLDivElement>(null);
  const [tabsStuck, setTabsStuck] = useState(false);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = tabsSentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setTabsStuck(!entry.isIntersecting), { root, threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const v = profile.values;
  const current = PROFILE_TABS.find((t) => t.id === tab)!;
  const hasContent = current.sections.length > 0;
  // Tabs made only of HR / system fields (e.g. Client Exposure) have nothing to edit
  const canEdit = current.sections.some((s) => s.video || s.list || s.skills || s.fields?.some((f) => !isReadOnly(f)));
  const shown = editing ? draft : profile;
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(profile);
  useEffect(() => {
    onDirtyChange?.(dirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);
  // Leaving the screen clears it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => onDirtyChange?.(false), []);

  useEffect(() => {
    // A new tab opens at its first section: if we'd scrolled past the tab bar, jump back to just under it
    const root = scrollRef.current;
    const sentinel = tabsSentinelRef.current;
    if (root && sentinel) {
      const barTop = root.scrollTop + sentinel.getBoundingClientRect().top - root.getBoundingClientRect().top;
      if (root.scrollTop > barTop) root.scrollTo({ top: barTop });
    }
    // Centre the chosen tab in the strip (scrolls the strip only, never the page)
    const el = tabRefs.current[tab];
    const strip = el?.parentElement;
    if (el && strip) strip.scrollTo({ left: el.offsetLeft - (strip.clientWidth - el.clientWidth) / 2, behavior: 'smooth' });
  }, [tab]);

  useEffect(() => {
    if (!scrollToItem) return;
    scrollRef.current?.querySelector(`[data-item="${scrollToItem}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setScrollToItem(null);
  }, [scrollToItem]);

  const startEdit = () => {
    setDraft(profile);
    setErrors({});
    setEditing(true);
  };
  const stopEdit = () => {
    setEditing(false);
    setErrors({});
    setDraft(profile);
  };

  const clearError = (key: string) => errors[key] && setErrors((e) => ({ ...e, [key]: '' }));

  const setValue = (key: string, value: ProfileValue) => {
    setDraft((d) => ({ ...d, values: { ...d.values, [key]: value } }));
    clearError(key);
  };

  const updateList = (listKey: string, change: (items: ProfileListItem[]) => ProfileListItem[]) =>
    setDraft((d) => ({ ...d, lists: { ...d.lists, [listKey]: change(d.lists[listKey] ?? []) } }));

  const addItem = (config: ProfileListConfig) => {
    const id = `${config.key}-${Date.now()}`;
    updateList(config.key, (items) => [...items, { id, [NEW_FLAG]: true }]);
    setScrollToItem(id);
  };

  const save = () => {
    // Edits can span tabs, so check every tab; remember which tab holds the first problem
    const found: Record<string, string> = {};
    let firstTab: ProfileTabId | null = null;
    PROFILE_TABS.forEach((t) => {
      const before = Object.keys(found).length;
      checkSections(t.sections, found);
      if (!firstTab && Object.keys(found).length > before) firstTab = t.id;
    });
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      if (firstTab && firstTab !== tab) setTab(firstTab);
      // wait for the tab to render before scrolling to the field
      setTimeout(() => scrollRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
      if (firstTab && firstTab !== tab) onNotify?.(`Fix the highlighted fields in ${PROFILE_TABS.find((t) => t.id === firstTab)!.label}.`);
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const lists = Object.fromEntries(
        Object.entries(draft.lists).map(([k, items]) => [k, items.map(({ [NEW_FLAG]: _new, ...rest }) => rest as ProfileListItem)])
      );
      onSave({ ...draft, lists });
      setSaving(false);
      setEditing(false);
    }, 500);
  };

  /** Adds an error message per invalid field in these sections to `found` */
  const checkSections = (sections: typeof current.sections, found: Record<string, string>) => {
    sections.forEach((s) => {
      if (s.fields) {
        visibleFields(s.fields, draft.values).forEach((f) => {
          const msg = validate(f, draft.values);
          if (msg) found[f.key] = msg;
          if (f.followUp && draft.values[f.key] === 'Yes' && !draft.values[f.followUp.key]) {
            found[f.followUp.key] = 'Choose when this applies.';
          }
        });
      }
      if (s.list) {
        const { key, fields } = s.list;
        (draft.lists[key] ?? []).forEach((item) =>
          visibleFields(fields, item).forEach((f) => {
            const msg = validate(f, item);
            if (msg) found[listErrorKey(key, item.id, f.key)] = msg;
          })
        );
      }
    });
  };


  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FB] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center justify-between h-14 px-4 relative">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => (dirty ? setConfirmDiscard('back') : onBack())}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            {/* The title already says "Edit Profile", so no separate "Editing" chip */}
            <h1 className="text-base font-bold screen-title">{editing ? 'Edit Profile' : title}</h1>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
        {/* Identity card: avatar, name, "role · department · ID", over three quick facts */}
        <section className="m-4 mb-3 bg-white rounded-3xl border border-[#EBF0F7] overflow-hidden">
          <div className="p-4 flex items-center gap-3.5">
            <span className="block w-16 h-16 rounded-2xl bg-linear-to-br from-amber-200 via-rose-200 to-violet-300 p-0.5 shrink-0">
              <ProfileAvatar name={v.fullName as string} photoUrl={photoUrl} className="w-full h-full rounded-[14px]" textClassName="text-lg" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[17px] font-extrabold leading-tight truncate">{v.fullName as string}</h2>
                <BadgeCheck className="w-5 h-5 text-white fill-[#2F68FE] shrink-0" aria-label="Verified" />
              </div>
              {/* Designation · Department · Employee ID, as on the web profile */}
              <p className="mt-1 text-[12px] font-medium text-slate-500 leading-snug">
                {[v.designation, v.department, v.employeeId].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 border-t border-slate-100 bg-slate-50/50 divide-x divide-slate-100">
            {[
              { icon: MapPin, label: 'Location', value: (v.location as string)?.split(',')[0] },
              { icon: Clock3, label: 'Tenure', value: tenureFrom(v.joiningDate as string).replace(/\s*Years?/i, ' yr').replace(/\s*Months?/i, ' mo') },
              { icon: Phone, label: 'Mobile', value: v.mobile as string },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="px-3 py-2.5 min-w-0">
                <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                  <Icon className="w-3 h-3 shrink-0" />
                  {label}
                </span>
                <span className="mt-0.5 block text-[12px] font-semibold text-[#1E293B] truncate">{value || '—'}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs (sticky) */}
        {/* Underline tabs: icon + label, active one in blue with a bar underneath */}
        <div ref={tabsSentinelRef} className="h-px -mb-px" aria-hidden="true" />
        <nav
          className={`sticky top-0 z-10 border-b border-slate-200/80 mb-3 transition-colors duration-200 ${
            tabsStuck ? 'bg-[#F5F7FB]/95 backdrop-blur-md' : 'bg-transparent'
          }`}
          aria-label="Profile sections"
        >
          <div className="flex gap-1 overflow-x-auto no-scrollbar px-2" role="tablist">
            {PROFILE_TABS.map((t) => {
              const Icon = TAB_ICONS[t.id];
              const on = t.id === tab;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    if (on) return;
                    // Unsaved changes: confirm before moving to another tab (Discard drops them)
                    if (dirty) return setConfirmDiscard({ tab: t.id });
                    setTab(t.id);
                  }}
                  className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {PROFILE_TAB_SHORT[t.id]}
                  <span
                    className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${
                      on ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </nav>

        <div className="px-4 pb-6 space-y-3">
          {!hasContent ? (
            <section className="bg-white rounded-2xl border border-slate-100 shadow-2xs py-10 px-6 flex flex-col items-center text-center">
              {React.createElement(TAB_ICONS[tab], { className: 'w-6 h-6 text-slate-300' })}
              <p className="mt-3 text-sm font-bold text-[#1E293B]">{current.label}</p>
              <p className="mt-1 text-[11.5px] text-slate-400">This section is on its way to mobile.</p>
            </section>
          ) : (
            <>

              {current.sections.map((section) =>
                section.video ? (
                  <IntroVideoSection key={section.title} values={shown.values} editing={editing} onChange={setValue} onNotify={onNotify} />
                ) : section.skills ? (
                  <SkillsSection
                    key={section.title}
                    title={section.title}
                    config={section.skills}
                    items={shown.lists[section.skills.key] ?? []}
                    editing={editing}
                    onChange={(items) => updateList(section.skills!.key, () => items)}
                  />
                ) : section.list && !section.fields ? (
                  <ListSection
                    key={section.title}
                    title={section.title}
                    config={section.list}
                    items={shown.lists[section.list.key] ?? []}
                    editing={editing}
                    errors={errors}
                    onAdd={() => openEntry(section.list!, null)}
                    onEditItem={(id) => openEntry(section.list!, id)}
                    onRemove={(id) => updateList(section.list!.key, (items) => items.filter((it) => it.id !== id))}
                    onChange={(id, key, value) => {
                      updateList(section.list!.key, (items) => items.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
                      clearError(listErrorKey(section.list!.key, id, key));
                    }}
                  />
                ) : (
                  <section key={section.title} className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4">
                    <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
                      <h3 className="text-[13px] font-bold text-[#1E293B] leading-snug">{section.title}</h3>
                      {section.badge ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-[9.5px] font-bold uppercase tracking-wide text-[#2F68FE] shrink-0">
                          {section.badge}
                        </span>
                      ) : (
                        // Editing, but nothing here can be changed (all fields are managed by HR / computed)
                        editing &&
                        (section.fields ?? []).length > 0 &&
                        visibleFields(section.fields ?? [], shown.values).every(isReadOnly) && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[9.5px] font-bold uppercase tracking-wide text-slate-500 shrink-0">
                            <Lock className="w-3 h-3" />
                            View Only
                          </span>
                        )
                      )}
                    </div>
                    {section.description && (
                      <p className="-mt-1 mb-3.5 flex items-start gap-1.5 text-[11px] text-slate-500 leading-relaxed">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-px text-slate-400" />
                        {section.description}
                      </p>
                    )}
                    <FieldGrid
                      fields={section.fields ?? []}
                      values={shown.values}
                      editing={editing}
                      errors={errors}
                      errorKey={(k) => k}
                      onChange={setValue}
                    />
                    {/* Fields + a list in one card (Family Details: parents / guardian, then Family Members) */}
                    {section.list && (
                      <ListSection
                        embedded
                        qualifications
                        title={section.list.title ?? section.title}
                        config={section.list}
                        items={shown.lists[section.list.key] ?? []}
                        editing={editing}
                        errors={errors}
                        onAdd={() => addItem(section.list!)}
                        onRemove={(id) => updateList(section.list!.key, (items) => items.filter((it) => it.id !== id))}
                        onChange={(id, key, value) => {
                          updateList(section.list!.key, (items) => items.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
                          clearError(listErrorKey(section.list!.key, id, key));
                        }}
                      />
                    )}
                    {section.note && <p className="mt-3.5 pt-3 border-t border-slate-100 text-[10.5px] text-slate-400 leading-relaxed">{section.note}</p>}
                  </section>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer: Edit (view mode) or Cancel / Save (edit mode) */}
      {(editing || (hasContent && canEdit)) && (
        <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {editing ? (
            <div className="grid grid-cols-[1fr_2fr] gap-2.5">
              <button
                type="button"
                onClick={() => (dirty ? setConfirmDiscard('cancel') : stopEdit())}
                className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !dirty}
                className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              {/* "Availability & Work Preferences" is too long for the button, so that tab uses its short name */}
              Edit {tab === 'availability' ? PROFILE_TAB_SHORT[tab] : current.label}
            </button>
          )}
        </div>
      )}

      {/* Experience (and other sheet: 'form' lists): add several / edit one */}
      {entrySheet && (
        <ListEntrySheet
          config={entrySheet.config}
          isOpen={entrySheet.open}
          editing={entrySheet.editId ? draft.lists[entrySheet.config.key]?.find((it) => it.id === entrySheet.editId) ?? null : null}
          onClose={() => setEntrySheet((s) => s && { ...s, open: false })}
          onSave={(entries) => {
            const { config, editId } = entrySheet;
            updateList(config.key, (items) =>
              editId ? items.map((it) => (it.id === editId ? { ...entries[0], id: editId } : it)) : [...items, ...entries]
            );
            // Fields on the entries were checked in the sheet; drop any stale page errors for them
            setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(`${config.key}-`))));
            if (!editId && entries[0]) setScrollToItem(entries[0].id);
            setEntrySheet((s) => s && { ...s, open: false });
          }}
        />
      )}

      {/* Academic Qualification */}
      <AcademicQualificationSheet
        isOpen={qualSheet !== null}
        editing={(() => {
          const item = qualSheet?.editId ? draft.lists[qualSheet.listKey]?.find((it) => it.id === qualSheet.editId) : undefined;
          return item ? listItemToQualification(item) : null;
        })()}
        onClose={() => setQualSheet(null)}
        onSave={(entries) => {
          const { listKey, editId } = qualSheet!;
          const rows = entries.map(qualificationToListItem);
          updateList(listKey, (items) =>
            editId ? items.map((it) => (it.id === editId ? { ...rows[0], id: editId } : it)) : [...items, ...rows]
          );
          if (!editId && rows[0]) setScrollToItem(rows[0].id);
          setQualSheet(null);
        }}
      />

      <BottomSheet isOpen={confirmDiscard !== null} onClose={() => setConfirmDiscard(null)} maxHeight="max-h-[50%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-4">
          <h2 className="text-base font-bold text-[#1E293B]">Discard your changes?</h2>
          <p className="mt-1 text-xs text-slate-500">Your profile edits haven't been saved.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          <button
            type="button"
            onClick={() => setConfirmDiscard(null)}
            className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={() => {
              const then = confirmDiscard;
              setConfirmDiscard(null);
              stopEdit();
              if (then === 'back') onBack();
              if (then && typeof then === 'object') setTab(then.tab);
            }}
            className="h-12 rounded-xl bg-rose-600 text-white text-xs font-bold active:bg-rose-700 cursor-pointer"
          >
            Discard
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
