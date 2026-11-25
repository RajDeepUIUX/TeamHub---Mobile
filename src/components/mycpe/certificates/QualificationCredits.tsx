import React, { useState } from 'react';
import { Info, Plus, Trash2, X } from 'lucide-react';
import { addRow, Allocation, cleanCredits, FieldRow, FIELDS_OF_STUDY, fieldsTaken, formatCredits, plural, removeRow, rowKey, totalCredits, updateRow } from './certModel';
import { McErrorText, McFloatLabel, McSingleSheet, PickButton, useBox, useFloating, useStack } from './McFormControls';

interface QualificationCreditsProps {
  allocations: Allocation[];
  /** Course sessions allow several fields of study per qualification; a certificate allows one */
  multipleFields: boolean;
  errors: Record<string, string>;
  onChange: (allocation: Allocation) => void;
  onRemove: (allocation: Allocation) => void;
}

/** One tinted card per selected qualification, so its white fields stand out from the page */
export const QualificationCredits: React.FC<QualificationCreditsProps> = ({ allocations, multipleFields, errors, onChange, onRemove }) => {
  const floating = useFloating();
  const stack = useStack();
  // Which field of study is being chosen
  const [picking, setPicking] = useState<{ allocId: string; rowId: string } | null>(null);
  const pickAlloc = allocations.find((a) => a.id === picking?.allocId);
  const pickRow = pickAlloc?.rows.find((r) => r.id === picking?.rowId);

  if (!allocations.length)
    return (
      <p className="px-3 py-3 rounded-xl border border-dashed border-mc-line-strong bg-white flex items-start gap-2 text-[13px] leading-5 text-mc-muted">
        <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        Select one or more qualifications to allocate credits.
      </p>
    );

  return (
    <div className="space-y-3">
      {allocations.map((a) => {
        const rows = multipleFields ? a.rows : a.rows.slice(0, 1);
        return (
          <section key={a.id} aria-label={a.qualification} className="@container rounded-xl border border-[#DAD5F9] bg-[#F8F7FE] overflow-clip">
            <header className="pl-3 min-h-12 flex items-center gap-2 bg-mc-primary-soft/70 border-b border-[#D3CDF8]">
              <h4 className="flex-1 min-w-0 py-2 text-[15px] leading-5 font-semibold text-mc-ink-2">
                {a.qualification}
                {/* A total says something new only when there's more than one field of study */}
                {rows.length > 1 && (
                  <span className="block text-[13px] font-normal text-mc-text" aria-live="polite">
                    {rows.length} Fields of Study · {formatCredits(totalCredits(a))}
                  </span>
                )}
              </h4>
              <button type="button" onClick={() => onRemove(a)} className="w-12 h-12 flex items-center justify-center text-mc-error cursor-pointer" aria-label={`Remove ${a.qualification}`}>
                <Trash2 className="w-[18px] h-[18px] stroke-[1.8]" />
              </button>
            </header>
            <div className={`p-3 ${floating ? 'pt-5' : ''} ${stack}`}>
              {rows.map((r, i) => (
                <FieldCredits
                  key={r.id}
                  allocation={a}
                  row={r}
                  first={i === 0}
                  removable={rows.length > 1}
                  errors={errors}
                  onPick={() => setPicking({ allocId: a.id, rowId: r.id })}
                  onChange={onChange}
                />
              ))}
              {multipleFields && (
                <button
                  type="button"
                  disabled={a.rows.length >= FIELDS_OF_STUDY.length}
                  onClick={() => onChange(addRow(a))}
                  className="w-full min-h-12 rounded-xl border border-dashed border-[#A99FF2] bg-white text-sm font-semibold text-mc-primary flex items-center justify-center gap-1.5 active:bg-mc-primary-tint disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add Field of Study
                </button>
              )}
            </div>
          </section>
        );
      })}
      <McSingleSheet
        isOpen={Boolean(pickAlloc && pickRow)}
        title="Field of Study"
        options={FIELDS_OF_STUDY}
        disabled={pickAlloc && pickRow && multipleFields ? { options: fieldsTaken(pickAlloc, pickRow.id), note: 'Already added' } : undefined}
        value={pickRow?.field ?? null}
        onClose={() => setPicking(null)}
        onSelect={(field) => {
          if (pickAlloc && pickRow) onChange(updateRow(pickAlloc, pickRow.id, { field }));
          setPicking(null);
        }}
      />
    </div>
  );
};

/** Side by side when the card is wide enough, stacked when it isn't (or text is enlarged) */
const FieldCredits: React.FC<{
  allocation: Allocation;
  row: FieldRow;
  first: boolean;
  removable: boolean;
  errors: Record<string, string>;
  onPick: () => void;
  onChange: (a: Allocation) => void;
}> = ({ allocation: a, row, first, removable, errors, onPick, onChange }) => {
  const box = useBox();
  const floating = useFloating();
  const [focused, setFocused] = useState(false);
  const fieldKey = rowKey(a.id, row.id, 'field');
  const creditsKey = rowKey(a.id, row.id, 'credits');
  // Labels sit above the first row; on narrow cards every row carries its own
  const label = `mb-1 block text-[13px] leading-5 font-medium text-mc-ink-2 ${first ? '' : '@min-[19.5rem]:hidden'}`;
  const above = (text: string) =>
    !floating && (
      <span className={label}>
        {text}
        <span className="text-mc-error"> *</span>
      </span>
    );
  return (
    <div className={`grid gap-x-2 items-start ${floating ? 'gap-y-5' : 'gap-y-2'} ${
        removable && !first ? `@max-[19.5rem]:border-t border-mc-line ${floating ? '@max-[19.5rem]:pt-5' : '@max-[19.5rem]:pt-3'}` : ''
      } ${removable ? 'grid-cols-[1fr_2.75rem] @min-[19.5rem]:grid-cols-[1fr_4.5rem_2.5rem]' : '@min-[18.5rem]:grid-cols-[1fr_5.5rem]'}`}>
      <div data-error-key={fieldKey} className={`min-w-0 ${removable ? 'col-span-2 @min-[19.5rem]:col-span-1' : ''}`}>
        {above('Field of Study')}
        <div className="relative">
          <PickButton
            value={row.field ?? ''}
            placeholder="Select field of study"
            compact
            ariaLabel={`Field of Study for ${a.qualification}`}
            error={errors[fieldKey]}
            describedBy={errors[fieldKey] ? `${fieldKey}-error` : undefined}
            onOpen={onPick}
          />
          {floating && <McFloatLabel label="Field of Study" required compact floated={Boolean(row.field)} />}
        </div>
        <McErrorText id={`${fieldKey}-error`} message={errors[fieldKey]} />
      </div>
      <div data-error-key={creditsKey} className="min-w-0">
        {above('Credits')}
        <div className="relative">
          <input
            inputMode="decimal"
            value={row.credits}
            placeholder={floating && !focused ? undefined : '0.0'}
            maxLength={6}
            aria-label={`Credits for ${a.qualification}${row.field ? `, ${row.field}` : ''}`}
            aria-required="true"
            aria-invalid={Boolean(errors[creditsKey])}
            aria-describedby={errors[creditsKey] ? `${creditsKey}-error` : undefined}
            enterKeyHint="done"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => onChange(updateRow(a, row.id, { credits: cleanCredits(e.target.value) }))}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className={`${box(errors[creditsKey])} ${floating ? 'h-13 px-[11px]' : 'h-12 px-2.5 !text-sm'} tabular-nums placeholder:text-[#98A2B3] select-text`}
          />
          {floating && <McFloatLabel label="Credits" required compact floated={focused || row.credits !== ''} />}
        </div>
        <McErrorText id={`${creditsKey}-error`} message={errors[creditsKey]} />
      </div>
      {removable && (
        <button
          type="button"
          onClick={() => onChange(removeRow(a, row.id))}
          className={`w-full flex items-center justify-center text-mc-error cursor-pointer ${
            floating ? 'h-13' : `h-12 mt-6 ${first ? '' : '@min-[19.5rem]:mt-0'}`
          }`}
          aria-label={`Remove ${row.field ?? 'field of study'} from ${a.qualification}`}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export const qualificationCount = (n: number) => plural(n, 'Qualification');
