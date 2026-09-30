import React, { useState } from 'react';
import { ChevronDown, Info, ListChecks, Plus, Sparkles, Trash2 } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { Dropdown } from '../../design-system/components/Dropdown';
import { DatePickerSheet } from '../common/DatePickerSheet';
import { MultiSelectSheet } from '../common/MultiSelectSheet';
import { todayIso } from '../common/DateWheelSheet';
import {
  AdditionalResponsibilities,
  RESPONSIBILITIES,
  ResponsibilityConfig,
  ResponsibilityEntry,
  ResponsibilityField,
  ResponsibilityValue,
  newResponsibilityEntry,
  newResponsibilityRow,
  responsibilityById,
} from '../../data/annualReviewData';
import {
  DateButton,
  ErrorText,
  FieldLabel,
  fieldBoxClass,
  fieldTextClass,
  formatReviewDate,
  inputClass,
  textareaClass,
} from './reviewFormParts';

type Errors = Record<string, string>;

/* ------------------------------ Validation -------------------------------- */

const filled = (v: ResponsibilityValue | undefined) => (Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim()));
const allFilled = (fields: ResponsibilityField[], values: Record<string, ResponsibilityValue>) => fields.every((f) => filled(values[f.key]));
const noneFilled = (fields: ResponsibilityField[], values: Record<string, ResponsibilityValue>) => !fields.some((f) => filled(values[f.key]));

export const validateAdditional = (a: AdditionalResponsibilities): Errors => {
  const errors: Errors = {};
  a.selected.forEach((id) => {
    const config = responsibilityById(id);
    const entry = a.entries[id];
    if (!config || !entry?.interested) return;
    if (config.rowFields) {
      const fields = config.rowFields;
      const used = entry.rows.filter((r) => !noneFilled(fields, r.values));
      if (used.length === 0 && entry.rows[0]) errors[`resp-${id}-${entry.rows[0].id}`] = 'Add at least one entry.';
      used.forEach((r) => {
        if (!allFilled(fields, r.values)) errors[`resp-${id}-${r.id}`] = 'Fill in all the fields for this entry.';
      });
    }
    if (config.fields && !allFilled(config.fields, entry.values)) errors[`resp-${id}`] = 'Fill in all the details.';
    if (config.remarksOnly && !entry.remarks.trim()) errors[`resp-${id}`] = 'Please explain in a few words.';
  });
  return errors;
};

/** Drop untouched entry rows before submitting */
export const cleanAdditional = (a: AdditionalResponsibilities): AdditionalResponsibilities => ({
  ...a,
  entries: Object.fromEntries(
    Object.entries(a.entries).map(([id, e]) => {
      const fields = responsibilityById(id)?.rowFields;
      return [id, fields ? { ...e, rows: e.rows.filter((r) => !noneFilled(fields, r.values)) } : e];
    })
  ),
});

/* -------------------------------- Pieces ---------------------------------- */

const YesNo: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <div role="radiogroup" className="inline-grid grid-cols-2 p-0.5 rounded-lg bg-slate-100 shrink-0">
    {[true, false].map((opt) => (
      <button
        key={String(opt)}
        type="button"
        role="radio"
        aria-checked={value === opt}
        onClick={() => onChange(opt)}
        className={`h-7 px-3.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
          value === opt
            ? opt
              ? 'bg-[#2F68FE] text-white shadow-xs'
              : 'bg-white text-slate-700 shadow-xs'
            : 'text-slate-500'
        }`}
      >
        {opt ? 'Yes' : 'No'}
      </button>
    ))}
  </div>
);

const displayValue = (field: ResponsibilityField, v: ResponsibilityValue | undefined) => {
  if (!filled(v)) return '—';
  if (Array.isArray(v)) return v.join(', ');
  return field.kind === 'date' ? formatReviewDate(v as string) : (v as string);
};

/** Read-only list of label → value */
const ValueList: React.FC<{ fields: ResponsibilityField[]; values: Record<string, ResponsibilityValue> }> = ({ fields, values }) => (
  <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
    {fields.map((f) => (
      <div key={f.key} className="min-w-0">
        <dt className="text-[10.5px] text-slate-400">{f.label}</dt>
        <dd className="text-[11.5px] font-semibold text-slate-700 break-words">{displayValue(f, values[f.key])}</dd>
      </div>
    ))}
  </dl>
);

/* --------------------------------- Tab ------------------------------------ */

interface AdditionalResponsibilitiesTabProps {
  value: AdditionalResponsibilities;
  update: (fn: (a: AdditionalResponsibilities) => AdditionalResponsibilities) => void;
  errors: Errors;
  clearError: (key: string) => void;
  readOnly: boolean;
}

type FieldTarget = { respId: string; rowId: string | null; field: ResponsibilityField };

export const AdditionalResponsibilitiesTab: React.FC<AdditionalResponsibilitiesTabProps> = ({
  value,
  update,
  errors,
  clearError,
  readOnly,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [multiTarget, setMultiTarget] = useState<FieldTarget | null>(null);
  const [dateTarget, setDateTarget] = useState<FieldTarget | null>(null);
  const [infoFor, setInfoFor] = useState<ResponsibilityConfig | null>(null);
  // Kept separate so the text stays put while the sheet animates closed
  const [infoOpen, setInfoOpen] = useState(false);

  const updateEntry = (id: string, fn: (e: ResponsibilityEntry) => ResponsibilityEntry) =>
    update((a) => ({ ...a, entries: { ...a.entries, [id]: fn(a.entries[id]) } }));

  const setFieldValue = (t: FieldTarget, v: ResponsibilityValue) => {
    updateEntry(t.respId, (e) =>
      t.rowId
        ? { ...e, rows: e.rows.map((r) => (r.id === t.rowId ? { ...r, values: { ...r.values, [t.field.key]: v } } : r)) }
        : { ...e, values: { ...e.values, [t.field.key]: v } }
    );
    clearError(t.rowId ? `resp-${t.respId}-${t.rowId}` : `resp-${t.respId}`);
  };

  const readTarget = (t: FieldTarget | null): ResponsibilityValue | undefined => {
    if (!t) return undefined;
    const e = value.entries[t.respId];
    const values = t.rowId ? e?.rows.find((r) => r.id === t.rowId)?.values : e?.values;
    return values?.[t.field.key];
  };

  const renderField = (respId: string, rowId: string | null, field: ResponsibilityField, values: Record<string, ResponsibilityValue>) => {
    const target = { respId, rowId, field };
    const v = values[field.key];
    switch (field.kind) {
      case 'select':
        return (
          <div key={field.key} className="min-w-0">
            <FieldLabel>{field.label}</FieldLabel>
            <Dropdown<string>
              value={(v as string) || null}
              options={field.options ?? []}
              onChange={(next) => setFieldValue(target, next)}
              placeholder="Select"
              ariaLabel={field.label}
              sheetTitle={field.label}
            />
          </div>
        );
      case 'multi': {
        const list = (v as string[] | undefined) ?? [];
        return (
          <div key={field.key} className="min-w-0">
            <FieldLabel>{field.label}</FieldLabel>
            <button
              type="button"
              onClick={() => setMultiTarget(target)}
              className={`${fieldBoxClass} flex items-center gap-2.5 hover:border-slate-300 cursor-pointer`}
            >
              <span className={fieldTextClass(list.length > 0)}>
                {list.length === 0 ? 'Nothing selected' : list.length === 1 ? list[0] : `${list.length} selected`}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>
        );
      }
      case 'date':
        return <DateButton key={field.key} label={field.label} value={(v as string) || ''} onClick={() => setDateTarget(target)} />;
      case 'number':
        return (
          <div key={field.key} className="min-w-0">
            <FieldLabel>{field.label}</FieldLabel>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={(v as string) || ''}
              onChange={(e) => setFieldValue(target, e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="Write"
              className={inputClass}
            />
          </div>
        );
    }
  };

  /** Two per row; a lone last field takes the full width */
  const renderFieldGrid = (
    fields: ResponsibilityField[],
    respId: string,
    rowId: string | null,
    values: Record<string, ResponsibilityValue>
  ) => (
    <div className="grid grid-cols-2 gap-2">
      {fields.map((f, i) => (
        <div key={f.key} className={fields.length % 2 === 1 && i === fields.length - 1 ? 'col-span-2' : ''}>
          {renderField(respId, rowId, f, values)}
        </div>
      ))}
    </div>
  );

  const renderCard = (config: ResponsibilityConfig) => {
    const entry = value.entries[config.id];
    if (!entry) return null;
    const cardError = errors[`resp-${config.id}`];

    return (
      <section
        key={config.id}
        className={`bg-white border rounded-2xl shadow-2xs overflow-hidden ${cardError ? 'border-rose-200' : 'border-[#EBF0F7]'}`}
      >
        <div className="p-3.5 flex items-start justify-between gap-3">
          <h3 className="text-[12.5px] font-bold text-[#1E293B] leading-snug pt-1">
            {config.title}
            {config.info && (
              <button
                type="button"
                onClick={() => {
                  setInfoFor(config);
                  setInfoOpen(true);
                }}
                className="inline-flex align-middle ml-1 -mt-0.5 w-5 h-5 rounded-full items-center justify-center text-slate-400 hover:text-slate-600 active:bg-slate-100 cursor-pointer"
                aria-label={`About ${config.title}`}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </h3>
          {readOnly ? (
            <span
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold shrink-0 ${
                entry.interested ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {entry.interested ? 'Yes' : 'No'}
            </span>
          ) : (
            <YesNo
              value={entry.interested}
              onChange={(v) => {
                updateEntry(config.id, (e) => ({ ...e, interested: v }));
                // Answering No clears this card's errors
                if (!v) {
                  clearError(`resp-${config.id}`);
                  entry.rows.forEach((r) => clearError(`resp-${config.id}-${r.id}`));
                }
              }}
            />
          )}
        </div>

        {entry.interested && (
          <div className="px-3.5 pb-3.5 space-y-2.5">
            {config.rowFields &&
              (readOnly ? (
                entry.rows.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 p-3">
                    <ValueList fields={config.rowFields!} values={r.values} />
                  </div>
                ))
              ) : (
                <>
                  {entry.rows.map((r, i) => {
                    const rowError = errors[`resp-${config.id}-${r.id}`];
                    return (
                      <div
                        key={r.id}
                        className={`rounded-xl border p-3 space-y-2.5 ${rowError ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Entry {i + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              updateEntry(config.id, (e) => ({
                                ...e,
                                rows: e.rows.length > 1 ? e.rows.filter((x) => x.id !== r.id) : [newResponsibilityRow()],
                              }));
                              clearError(`resp-${config.id}-${r.id}`);
                            }}
                            className="w-7 h-7 -m-1 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 active:bg-rose-50 cursor-pointer"
                            aria-label={`Remove entry ${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {renderFieldGrid(config.rowFields!, config.id, r.id, r.values)}
                        <ErrorText message={rowError} />
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => updateEntry(config.id, (e) => ({ ...e, rows: [...e.rows, newResponsibilityRow()] }))}
                    className="w-full h-10 rounded-xl border border-dashed border-indigo-200 text-[#4F46E5] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-indigo-50 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add More
                  </button>
                </>
              ))}

            {config.fields &&
              (readOnly ? (
                <ValueList fields={config.fields} values={entry.values} />
              ) : (
                renderFieldGrid(config.fields, config.id, null, entry.values)
              ))}

            {config.noRemarks ? null : readOnly ? (
              entry.remarks && <p className="text-[11.5px] text-slate-500 leading-snug">“{entry.remarks}”</p>
            ) : (
              <div>
                <FieldLabel>{config.remarksOnly ? 'Remarks' : 'Remarks (optional)'}</FieldLabel>
                <textarea
                  value={entry.remarks}
                  onChange={(e) => {
                    const remarks = e.target.value;
                    updateEntry(config.id, (x) => ({ ...x, remarks }));
                    if (config.remarksOnly) clearError(`resp-${config.id}`);
                  }}
                  rows={4}
                  maxLength={500}
                  placeholder="Please explain in few words"
                  className={textareaClass}
                />
              </div>
            )}
            <ErrorText message={cardError} />
          </div>
        )}
      </section>
    );
  };

  const selectedConfigs = RESPONSIBILITIES.filter((r) => value.selected.includes(r.id));
  const multiValue = readTarget(multiTarget);
  const dateValue = readTarget(dateTarget);

  return (
    <>
      {/* Picker */}
      <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-3.5">
        <p className="text-[12px] font-semibold text-[#1E293B] leading-relaxed">
          Select the additional responsibilities which you would like to take. Please ensure that taking additional
          responsibilities doesn't have to hamper your current timesheet work.{' '}
          <em className="text-rose-500 font-semibold">(multiple selection is allowed)</em>
        </p>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-3 w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 text-xs cursor-pointer active:bg-slate-50"
          >
            <span className="flex items-center gap-2 min-w-0">
              <ListChecks className="w-4 h-4 text-[#2F68FE] shrink-0" />
              <span className={value.selected.length ? 'font-semibold text-[#1E293B]' : 'text-slate-400'}>
                {value.selected.length
                  ? `${value.selected.length} ${value.selected.length === 1 ? 'responsibility' : 'responsibilities'} selected`
                  : 'Select responsibilities'}
              </span>
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        )}
      </section>

      {selectedConfigs.length === 0 ? (
        <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs px-6 py-9 flex flex-col items-center text-center">
          <span className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-50 to-violet-100 text-[#4F46E5] flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </span>
          <p className="mt-3 text-[13px] font-bold text-[#1E293B]">
            {readOnly ? 'No additional responsibilities this cycle' : 'Ready to grow beyond your timesheet?'}
          </p>
          <p className="mt-1 text-[12px] text-slate-500 leading-relaxed max-w-[270px]">
            {readOnly
              ? 'None were selected in this review.'
              : 'Pick the extra responsibilities you would like to take on this year, like training teammates or leading a team.'}
          </p>
        </div>
      ) : (
        selectedConfigs.map(renderCard)
      )}

      <MultiSelectSheet
        isOpen={pickerOpen}
        title="Additional Responsibilities"
        options={RESPONSIBILITIES.map((r) => ({ value: r.id, label: r.title }))}
        selected={value.selected}
        searchPlaceholder="Search responsibilities"
        onClose={() => setPickerOpen(false)}
        onApply={(ids) => {
          const ordered = RESPONSIBILITIES.filter((r) => ids.includes(r.id));
          update((a) => ({
            selected: ordered.map((r) => r.id),
            // Keep answers for responsibilities that stay selected
            entries: Object.fromEntries(ordered.map((r) => [r.id, a.entries[r.id] ?? newResponsibilityEntry(r)])),
          }));
          value.selected.filter((id) => !ids.includes(id)).forEach((id) => {
            clearError(`resp-${id}`);
            value.entries[id]?.rows.forEach((r) => clearError(`resp-${id}-${r.id}`));
          });
          setPickerOpen(false);
        }}
      />

      <MultiSelectSheet
        isOpen={Boolean(multiTarget)}
        title={multiTarget?.field.label ?? ''}
        options={(multiTarget?.field.options ?? []).map((o) => ({ value: o, label: o }))}
        selected={Array.isArray(multiValue) ? multiValue : []}
        onClose={() => setMultiTarget(null)}
        onApply={(list) => {
          if (multiTarget) setFieldValue(multiTarget, list);
          setMultiTarget(null);
        }}
      />

      <BottomSheet isOpen={infoOpen} onClose={() => setInfoOpen(false)} maxHeight="max-h-[50%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-6">
          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-[#1E293B] leading-snug pt-1.5">{infoFor?.title}</h2>
          </div>
          <p className="mt-2.5 text-[12.5px] text-slate-600 leading-relaxed">{infoFor?.info}</p>
          <button
            type="button"
            onClick={() => setInfoOpen(false)}
            className="mt-5 w-full h-11 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold active:bg-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </BottomSheet>

      <DatePickerSheet
        isOpen={Boolean(dateTarget)}
        mode="single"
        title={dateTarget?.field.label ?? ''}
        start={typeof dateValue === 'string' && dateValue ? dateValue : null}
        minDate={todayIso()}
        onClose={() => setDateTarget(null)}
        onApply={(iso) => {
          if (dateTarget) setFieldValue(dateTarget, iso);
          setDateTarget(null);
        }}
      />
    </>
  );
};
