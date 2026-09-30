import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Clock3,
  Phone,
  UserRound,
  User,
  BriefcaseBusiness,
  Sparkles,
  GraduationCap,
  Handshake,
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
} from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { Dropdown } from '../../design-system/components/Dropdown';
import { BottomSheet } from '../common/BottomSheet';
import { DateWheelSheet, todayIso } from '../common/DateWheelSheet';
import { MultiSelectSheet } from '../common/MultiSelectSheet';
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

interface MyProfileViewProps {
  profile: MyProfileData;
  photoUrl: string | null;
  /** Open straight into edit mode (e.g. from "Edit Profile") */
  startEditing?: boolean;
  onBack: () => void;
  onSave: (profile: MyProfileData) => void;
}

const TAB_ICONS: Record<ProfileTabId, React.ElementType> = {
  personal: User,
  professional: BriefcaseBusiness,
  skills: Sparkles,
  learning: GraduationCap,
  clients: Handshake,
  availability: CalendarClock,
  video: Video,
};

/** Marks list items added in the current edit session */
const NEW_FLAG = '__new';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

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

/** Pick a document; only the file name is kept in this prototype */
const FileField: React.FC<{ value: string; onChange: (name: string) => void }> = ({ value, onChange }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 h-11 pl-3 pr-1.5 bg-white border border-slate-200 rounded-xl">
        <FileText className={`w-4 h-4 shrink-0 ${value ? 'text-[#2F68FE]' : 'text-slate-300'}`} />
        <span className={`flex-1 min-w-0 truncate text-[12.5px] font-medium ${value ? 'text-[#1E293B]' : 'text-slate-400'}`}>
          {value || 'No file chosen'}
        </span>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="h-8 px-2.5 rounded-lg bg-blue-50 text-[#2F68FE] text-[11px] font-bold flex items-center gap-1 active:bg-blue-100 cursor-pointer shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          {value ? 'Replace' : 'Upload'}
        </button>
        <input
          ref={ref}
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            if (file.size > MAX_FILE_BYTES) return setError('File is too large. Maximum size is 10 MB.');
            setError('');
            onChange(file.name);
          }}
        />
      </div>
      {error ? (
        <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>
      ) : (
        <p className="px-0.5 text-[10.5px] text-slate-400">PDF, JPG or PNG · up to 10 MB</p>
      )}
    </div>
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
      return <Dropdown ariaLabel={f.label} value={(value as string) || null} placeholder="Select" options={f.options ?? []} onChange={onChange} />;
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
      return <FileField value={(value as string) ?? ''} onChange={onChange} />;
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
      const numeric = f.type === 'tel' || f.type === 'number' || f.type === 'year';
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

const SubHeading: React.FC<{ children: React.ReactNode; right?: React.ReactNode; accent?: boolean }> = ({ children, right, accent }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <span className={`text-[10.5px] font-bold uppercase tracking-wider ${accent ? 'text-[#2F68FE]' : 'text-slate-500'}`}>{children}</span>
    <span className="flex-1 h-px bg-slate-100" />
    {right}
  </div>
);

/** 2-column grid of fields (view or edit), with Father / Mother style sub-groups */
const FieldGrid: React.FC<{
  fields: ProfileField[];
  values: ProfileValues;
  editing: boolean;
  errors: Record<string, string>;
  errorKey: (fieldKey: string) => string;
  onChange: (fieldKey: string, v: ProfileValue) => void;
}> = ({ fields, values, editing, errors, errorKey, onChange }) => {
  const gap = editing ? 'gap-x-3 gap-y-3.5' : 'gap-x-4 gap-y-3.5';
  const render = (f: ProfileField) => {
    if (!editing) {
      return (
        <div key={f.key} className={isWide(f) || f.type === 'textarea' || f.type === 'file' ? 'col-span-2' : 'min-w-0'}>
          <span className="block text-[11px] text-slate-400 leading-snug">{f.label}</span>
          <FieldValue field={f} values={values} />
          {f.hint && <span className="block text-[10.5px] text-slate-400 mt-0.5">{f.hint}</span>}
        </div>
      );
    }
    const key = errorKey(f.key);
    const error = errors[key] ?? '';
    return (
      <div key={f.key} data-field={key} className={`space-y-1.5 ${isWide(f) ? 'col-span-2' : 'min-w-0'}`}>
        {f.type !== 'checkbox' && (
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 min-w-0">
            <span className="truncate">
              {f.label}
              {f.required && !isReadOnly(f) && <span className="text-rose-500"> *</span>}
            </span>
            {f.type === 'auto' && (
              <span className="px-1.5 py-px rounded-md bg-blue-50 text-[9px] font-bold uppercase tracking-wide text-[#2F68FE] shrink-0">Auto</span>
            )}
          </label>
        )}
        <FieldInput field={f} values={values} error={error} onChange={(v) => onChange(f.key, v)} />
        {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
      </div>
    );
  };

  return (
    <div className={`grid grid-cols-2 items-start ${gap}`}>
      {groupRuns(visibleFields(fields, values)).map((run, i) =>
        run.group ? (
          <div key={`run-${i}`} className="col-span-2 pt-1">
            <SubHeading>{run.group}</SubHeading>
            <div className={`grid grid-cols-2 items-start ${gap}`}>{run.fields.map(render)}</div>
          </div>
        ) : (
          <React.Fragment key={`run-${i}`}>{run.fields.map(render)}</React.Fragment>
        )
      )}
    </div>
  );
};

/* ------------------------------- List sections ------------------------------ */

const listErrorKey = (listKey: string, id: string, field: string) => `${listKey}-${id}-${field}`;

const ListSection: React.FC<{
  title: string;
  config: ProfileListConfig;
  items: ProfileListItem[];
  editing: boolean;
  errors: Record<string, string>;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, key: string, value: ProfileValue) => void;
}> = ({ title, config, items, editing, errors, onAdd, onRemove, onChange }) => {
  const stats = config.summary?.(items);
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
            onClick={onAdd}
            className="h-8 px-2.5 -my-1 rounded-lg border border-[#2F68FE]/30 text-[#2F68FE] text-[11px] font-bold flex items-center gap-1 active:bg-blue-50 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {config.addLabel}
          </button>
        )}
      </div>

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

      {items.length === 0 ? (
        <div className="py-5 flex flex-col items-center text-center">
          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </span>
          <p className="mt-2 text-xs font-semibold text-slate-600">{config.emptyText}</p>
          <p className="text-[11px] text-slate-400">{editing ? `Tap ${config.addLabel} to get started.` : 'Tap Edit to add one.'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((item, i) => (
            <div key={item.id} data-item={item.id}>
              {items.length === 1 && !item[NEW_FLAG] ? (
                // A single entry needs no "Qualification 1" heading; edit mode keeps just the Remove action
                editing && (
                  <div className="flex justify-end -mt-1 mb-2">
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                )
              ) : (
              <SubHeading
                accent
                right={
                  editing && (
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )
                }
              >
                {item[NEW_FLAG] ? `New ${config.itemLabel.toLowerCase()}` : `${config.itemLabel} ${i + 1}`}
              </SubHeading>
              )}
              <FieldGrid
                fields={config.fields}
                values={item}
                editing={editing}
                errors={errors}
                errorKey={(k) => listErrorKey(config.key, item.id, k)}
                onChange={(k, v) => onChange(item.id, k, v)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
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
                <span className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[11px] font-bold ${it.level ? 'text-[#1E293B]' : 'text-slate-400'}`}>{(it.level as string) || 'Not rated'}</span>
                  <LevelBars value={(it.level as string) ?? ''} />
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

export const MyProfileView: React.FC<MyProfileViewProps> = ({ profile, photoUrl, startEditing, onBack, onSave }) => {
  const [tab, setTab] = useState<ProfileTabId>('personal');
  const [editing, setEditing] = useState(Boolean(startEditing));
  const [draft, setDraft] = useState<MyProfileData>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [lockedTabHint, setLockedTabHint] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState<null | 'back' | 'cancel'>(null);
  const [scrollToItem, setScrollToItem] = useState<string | null>(null);
  const tabRefs = useRef<Partial<Record<ProfileTabId, HTMLButtonElement | null>>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const v = profile.values;
  const current = PROFILE_TABS.find((t) => t.id === tab)!;
  const hasContent = current.sections.length > 0;
  const shown = editing ? draft : profile;
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(profile);

  useEffect(() => {
    tabRefs.current[tab]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [tab]);

  useEffect(() => {
    if (!lockedTabHint) return;
    const t = setTimeout(() => setLockedTabHint(false), 2200);
    return () => clearTimeout(t);
  }, [lockedTabHint]);

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
    const found: Record<string, string> = {};
    current.sections.forEach((s) => {
      if (s.fields) {
        visibleFields(s.fields, draft.values).forEach((f) => {
          const msg = validate(f, draft.values);
          if (msg) found[f.key] = msg;
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
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      scrollRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const hasReadOnly = current.sections.some((s) => s.fields?.some((f) => f.locked));

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FB] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => (dirty ? setConfirmDiscard('back') : onBack())}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold ml-2">{editing ? 'Edit Profile' : 'My Profile'}</h1>
          </div>
          {editing && (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10.5px] font-bold flex items-center gap-1">
              <Pencil className="w-3 h-3" />
              Editing
            </span>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
        {/* Identity card */}
        <section className="m-4 mb-3 bg-white rounded-3xl p-4 border border-white shadow-[0_12px_32px_-16px_rgba(79,70,229,0.3)]">
          <div className="flex items-center gap-3.5">
            <span className="block w-16 h-16 rounded-2xl bg-linear-to-br from-amber-200 via-rose-200 to-violet-300 p-0.5 shrink-0">
              <ProfileAvatar name={v.fullName as string} photoUrl={photoUrl} className="w-full h-full rounded-[14px]" textClassName="text-lg" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-extrabold leading-tight truncate">{v.fullName as string}</h2>
                <BadgeCheck className="w-4.5 h-4.5 text-[#2F68FE] shrink-0" />
              </div>
              <p className="text-[11.5px] text-slate-500 leading-snug mt-0.5">
                {v.designation as string} · {v.department as string} · {v.employeeId as string}
              </p>
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {[
              { icon: MapPin, text: v.location as string },
              { icon: Clock3, text: `Tenure: ${tenureFrom(v.joiningDate as string)}` },
              { icon: Phone, text: v.mobile as string },
              { icon: UserRound, text: `Reports to ${v.reportingManager as string}` },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 text-[11px] font-medium text-slate-600">
                <Icon className="w-3 h-3 text-slate-400" />
                {text}
              </span>
            ))}
          </div>
        </section>

        {/* Tabs (sticky) */}
        <nav className="sticky top-0 z-10 bg-[#F5F7FB]/95 backdrop-blur-md pt-1 pb-2" aria-label="Profile sections">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4" role="tablist">
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
                    if (editing) return setLockedTabHint(true);
                    setTab(t.id);
                  }}
                  className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    on
                      ? 'bg-[#2F68FE] text-white shadow-[0_6px_14px_-6px_rgba(47,104,254,0.6)]'
                      : `bg-white border border-slate-200 text-slate-600 ${editing ? 'opacity-45' : ''}`
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {PROFILE_TAB_SHORT[t.id]}
                </button>
              );
            })}
          </div>
          {lockedTabHint && (
            <p className="mx-4 mt-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800 animate-in fade-in duration-150">
              Save or cancel your changes before switching tabs.
            </p>
          )}
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
              {editing && hasReadOnly && (
                <p className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/80 text-[11px] text-slate-500">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Greyed-out fields are managed by HR. Raise a ticket to change them.
                </p>
              )}

              {current.sections.map((section) =>
                section.skills ? (
                  <SkillsSection
                    key={section.title}
                    title={section.title}
                    config={section.skills}
                    items={shown.lists[section.skills.key] ?? []}
                    editing={editing}
                    onChange={(items) => updateList(section.skills!.key, () => items)}
                  />
                ) : section.list ? (
                  <ListSection
                    key={section.title}
                    title={section.title}
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
                ) : (
                  <section key={section.title} className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4">
                    <h3 className="pb-2.5 mb-3 border-b border-slate-100 text-[13px] font-bold text-[#1E293B]">{section.title}</h3>
                    <FieldGrid
                      fields={section.fields ?? []}
                      values={shown.values}
                      editing={editing}
                      errors={errors}
                      errorKey={(k) => k}
                      onChange={setValue}
                    />
                    {section.note && <p className="mt-3.5 pt-3 border-t border-slate-100 text-[10.5px] text-slate-400 leading-relaxed">{section.note}</p>}
                  </section>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer: Edit (view mode) or Cancel / Save (edit mode) */}
      {hasContent && (
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
              Edit {current.label}
            </button>
          )}
        </div>
      )}

      {/* Discard confirmation */}
      <BottomSheet isOpen={confirmDiscard !== null} onClose={() => setConfirmDiscard(null)} maxHeight="max-h-[50%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-4">
          <h2 className="text-base font-bold text-[#1E293B]">Discard your changes?</h2>
          <p className="mt-1 text-xs text-slate-500">Your edits to {current.label} haven't been saved.</p>
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
