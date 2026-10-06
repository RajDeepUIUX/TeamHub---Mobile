import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, CheckCircle2, FileText, Info, Plus, Trash2, UploadCloud } from 'lucide-react';
import { Dropdown } from '../../design-system/components/Dropdown';
import { DatePickerSheet } from '../common/DatePickerSheet';
import { todayIso } from '../common/DateWheelSheet';
import { DateButton, ErrorText, FieldLabel, fieldBoxClass, fieldTextClass, inputClass, textareaClass } from '../profile/reviewFormParts';
import {
  ADVANCE_REASONS,
  ADVANCE_STAFF,
  AdvanceCheque,
  AdvanceRequest,
  AdvanceRequestType,
  BANKS,
  REQUEST_LIMITS,
  REQUEST_TYPES,
  REQUIRED_DOCUMENTS,
  formatAdvanceDate,
  formatINR,
  isEvLoan,
  monthlyDeduction,
  requestAvailability,
} from '../../data/advanceSalaryData';

export type AdvanceDraft = Pick<
  AdvanceRequest,
  'type' | 'amount' | 'months' | 'reason' | 'otherReason' | 'bank' | 'expectedPurchaseDate' | 'cheques' | 'documents'
>;

interface AdvanceRequestViewProps {
  requests: AdvanceRequest[];
  /** Set when editing an existing request */
  initial?: AdvanceRequest;
  onBack: () => void;
  onOpenGuidelines: () => void;
  onSubmit: (draft: AdvanceDraft) => void;
}

type Errors = Record<string, string>;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
    <h2 className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 text-[12.5px] font-bold text-[#1E1B4B]">{title}</h2>
    <div className="p-4 space-y-3.5">{children}</div>
  </section>
);

const ReadOnly: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0">
    <span className="block text-[10.5px] text-slate-400">{label}</span>
    <span className="block text-[12px] font-semibold text-slate-700 truncate">{value}</span>
  </div>
);

const Required: React.FC = () => <span className="text-rose-500"> *</span>;

/** File picker that keeps file names only (prototype) */
const FileField: React.FC<{
  label: React.ReactNode;
  files: string[];
  multiple?: boolean;
  error?: string;
  onChange: (files: string[]) => void;
}> = ({ label, files, multiple, error, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = () => inputRef.current?.click();

  return (
    <div data-invalid={Boolean(error) || undefined}>
      <FieldLabel>{label}</FieldLabel>

      {/* Uploaded files */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((name) => (
            <li
              key={name}
              className="flex items-center gap-2.5 pl-2.5 pr-1.5 py-2 rounded-xl border border-emerald-100 bg-emerald-50/40"
            >
              <span className="w-8 h-8 rounded-lg bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] font-semibold text-[#1E293B] truncate">{name}</span>
                <span className="flex items-center gap-1 text-[10.5px] font-medium text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Uploaded
                </span>
              </span>
              {!multiple && (
                <button
                  type="button"
                  onClick={pick}
                  className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
                >
                  Replace
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange(files.filter((f) => f !== name))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 active:bg-rose-50 cursor-pointer"
                aria-label={`Remove ${name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Upload target: shown when empty, and as "add more" for multi-file fields */}
      {(files.length === 0 || multiple) &&
        (files.length === 0 ? (
          <button
            type="button"
            onClick={pick}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-[1.5px] border-dashed text-left transition-colors cursor-pointer ${
              error
                ? 'border-rose-300 bg-rose-50/40 active:bg-rose-50'
                : 'border-indigo-200 bg-indigo-50/40 active:bg-indigo-50'
            }`}
          >
            <span className="w-9 h-9 rounded-xl bg-white border border-indigo-100 text-[#4F46E5] flex items-center justify-center shrink-0 shadow-2xs">
              <UploadCloud className="w-4.5 h-4.5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[12px] font-bold text-[#1E293B]">
                Tap to upload{multiple ? ' files' : ''}
              </span>
              <span className="block text-[10.5px] text-slate-400">PDF, JPG or PNG · up to 5 MB</span>
            </span>
            <span className="h-7 px-3 rounded-lg bg-[#2F68FE] text-white text-[11px] font-bold flex items-center shrink-0">Browse</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={pick}
            className="mt-1.5 w-full h-9 rounded-xl border border-dashed border-indigo-200 text-[#4F46E5] text-[11.5px] font-bold flex items-center justify-center gap-1.5 active:bg-indigo-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add more files
          </button>
        ))}

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []).map((f) => f.name);
          if (picked.length) onChange(multiple ? [...files, ...picked.filter((n) => !files.includes(n))] : picked.slice(0, 1));
          e.target.value = '';
        }}
      />
      <div className="mt-1">
        <ErrorText message={error} />
      </div>
    </div>
  );
};

const emptyCheques = (): AdvanceCheque[] => [0, 1, 2].map(() => ({ number: '', file: '' }));

export const AdvanceRequestView: React.FC<AdvanceRequestViewProps> = ({ requests, initial, onBack, onOpenGuidelines, onSubmit }) => {
  const today = todayIso();
  const availability = useMemo(() => requestAvailability(requests, today, initial?.id), [requests, today, initial?.id]);
  const firstAvailable = REQUEST_TYPES.find((t) => !availability[t]) ?? REQUEST_TYPES[0];

  const [type, setType] = useState<AdvanceRequestType>(initial?.type ?? firstAvailable);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [months, setMonths] = useState<number | null>(initial?.months ?? null);
  const [reason, setReason] = useState(initial?.reason ?? '');
  const [otherReason, setOtherReason] = useState(initial?.otherReason ?? '');
  const [bank, setBank] = useState(initial?.bank ?? ADVANCE_STAFF.salaryBank);
  const [purchaseDate, setPurchaseDate] = useState(initial?.expectedPurchaseDate ?? '');
  const [cheques, setCheques] = useState<AdvanceCheque[]>(initial?.cheques ?? emptyCheques());
  const [documents, setDocuments] = useState<Record<string, string[]>>(initial?.documents ?? {});
  const [errors, setErrors] = useState<Errors>({});
  const [dateOpen, setDateOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ev = isEvLoan(type);
  const limit = REQUEST_LIMITS[type];
  const amountNum = Number(amount) || 0;
  const emi = monthlyDeduction(amountNum, months ?? 0);
  const docList = REQUIRED_DOCUMENTS[ev ? 'ev' : 'advance'];

  const clear = (key: string) =>
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const changeType = (t: AdvanceRequestType) => {
    setType(t);
    if (months && months > REQUEST_LIMITS[t].maxMonths) setMonths(null);
    // Documents differ between Advance Salary and EV loans
    if (isEvLoan(t) !== ev) setDocuments({});
    setErrors({});
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (availability[type]) e.type = availability[type]!;
    if (!amountNum) e.amount = 'Enter the amount you need.';
    else if (amountNum > limit.maxAmount) e.amount = `The maximum for ${type} is ${formatINR(limit.maxAmount)}.`;
    if (!months) e.months = 'Select a repayment duration.';
    if (!ev && !reason) e.reason = 'Select a reason.';
    if (!ev && reason === 'Other' && !otherReason.trim()) e.otherReason = 'Tell us the reason.';
    if (ev && !purchaseDate) e.purchaseDate = 'Add the expected purchase date.';
    const seen = new Set<string>();
    cheques.forEach((c, i) => {
      if (!/^\d{6}$/.test(c.number)) e[`cheque-${i}`] = 'Enter the complete 6-digit cheque number (e.g. 000001).';
      else if (seen.has(c.number)) e[`cheque-${i}`] = 'Each cheque number must be different.';
      seen.add(c.number);
      if (!c.file) e[`chequeFile-${i}`] = 'Upload a scanned copy of this cheque.';
    });
    docList.forEach((d) => {
      if (!documents[d.label]?.length) e[`doc-${d.label}`] = 'This document is required.';
    });
    return e;
  };

  const handleSubmit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      // Bring the first problem into view
      requestAnimationFrame(() =>
        scrollRef.current?.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      );
      return;
    }
    onSubmit({
      type,
      amount: amountNum,
      months: months!,
      reason: ev ? '' : reason,
      otherReason: !ev && reason === 'Other' ? otherReason.trim() : '',
      bank,
      expectedPurchaseDate: ev ? purchaseDate : '',
      cheques,
      documents,
    });
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4 relative">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold screen-title">{initial ? 'Edit Request' : 'Raise Request'}</h1>
          <button
            type="button"
            onClick={onOpenGuidelines}
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[#2F68FE] text-[11.5px] font-bold active:bg-blue-50 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            Guidelines
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {errorCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11.5px] font-semibold text-rose-600">
            <Info className="w-4 h-4 shrink-0" />
            {errorCount === 1 ? '1 field needs your attention.' : `${errorCount} fields need your attention.`}
          </div>
        )}

        <Section title="Staff Details">
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            <ReadOnly label="Staff Name" value={`${ADVANCE_STAFF.name} (${ADVANCE_STAFF.employeeId})`} />
            <ReadOnly label="Department" value={ADVANCE_STAFF.department} />
            <ReadOnly label="Division" value={ADVANCE_STAFF.division} />
            <ReadOnly label="Date of Joining" value={formatAdvanceDate(ADVANCE_STAFF.joiningDate)} />
          </div>
        </Section>

        <Section title="Request Details">
          <div data-invalid={Boolean(errors.type) || undefined}>
            <FieldLabel>
              Request For
              <Required />
            </FieldLabel>
            <Dropdown<AdvanceRequestType>
              value={type}
              options={REQUEST_TYPES.map((t) => ({ value: t, label: t, description: availability[t] ?? undefined, disabled: Boolean(availability[t]) }))}
              onChange={changeType}
              ariaLabel="Request for"
            />
            <div className="mt-1">
              <ErrorText message={errors.type} />
            </div>
          </div>

          <div data-invalid={Boolean(errors.amount) || undefined}>
            <FieldLabel>
              Requested Amount
              <Required />
            </FieldLabel>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">₹</span>
              <input
                inputMode="numeric"
                value={amount ? Number(amount).toLocaleString('en-IN') : ''}
                onChange={(e) => {
                  setAmount(e.target.value.replace(/\D/g, '').slice(0, 7));
                  clear('amount');
                }}
                placeholder="0"
                className={`${inputClass} pl-7 ${errors.amount ? 'border-rose-300' : ''}`}
              />
            </div>
            <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-500 leading-snug">
              <Info className="w-3.5 h-3.5 text-[#2F68FE] shrink-0 mt-px" />
              <span>
                {limit.info} <strong className="font-semibold text-slate-700">Limit: {formatINR(limit.maxAmount)}</strong>
              </span>
            </p>
            <div className="mt-1">
              <ErrorText message={errors.amount} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0" data-invalid={Boolean(errors.months) || undefined}>
              <FieldLabel>
                Repayment Duration
                <Required />
              </FieldLabel>
              <Dropdown<number>
                value={months}
                options={Array.from({ length: limit.maxMonths }, (_, i) => ({ value: i + 1, label: `${i + 1} ${i ? 'months' : 'month'}` }))}
                onChange={(v) => {
                  setMonths(v);
                  clear('months');
                }}
                placeholder="Select month"
                ariaLabel="Repayment duration"
                sheetTitle="Repayment duration"
              />
            </div>
            <div className="min-w-0">
              <FieldLabel>Monthly Deduction</FieldLabel>
              <div className={`${fieldBoxClass} bg-slate-50 shadow-none flex items-center`}>
                <span className={fieldTextClass(emi > 0)}>{emi > 0 ? `${formatINR(emi)} / month` : 'Auto-calculated'}</span>
              </div>
            </div>
          </div>
          {errors.months && <ErrorText message={errors.months} />}

          {ev ? (
            <div data-invalid={Boolean(errors.purchaseDate) || undefined}>
              <DateButton
                label="Expected Purchase Date *"
                value={purchaseDate}
                onClick={() => setDateOpen(true)}
              />
              <div className="mt-1">
                <ErrorText message={errors.purchaseDate} />
              </div>
            </div>
          ) : (
            <>
              <div data-invalid={Boolean(errors.reason) || undefined}>
                <FieldLabel>
                  Reason For Request
                  <Required />
                </FieldLabel>
                <Dropdown<string>
                  value={reason || null}
                  options={ADVANCE_REASONS}
                  onChange={(v) => {
                    setReason(v);
                    clear('reason');
                    clear('otherReason');
                  }}
                  placeholder="Select reason"
                  ariaLabel="Reason for request"
                />
                <div className="mt-1">
                  <ErrorText message={errors.reason} />
                </div>
              </div>
              {reason === 'Other' && (
                <div data-invalid={Boolean(errors.otherReason) || undefined}>
                  <FieldLabel>
                    Other Reason
                    <Required />
                  </FieldLabel>
                  <textarea
                    value={otherReason}
                    onChange={(e) => {
                      setOtherReason(e.target.value);
                      clear('otherReason');
                    }}
                    rows={3}
                    maxLength={300}
                    placeholder="Tell us briefly why you need the advance"
                    className={textareaClass}
                  />
                  <ErrorText message={errors.otherReason} />
                </div>
              )}
            </>
          )}

          <div>
            <FieldLabel>Bank Name</FieldLabel>
            <Dropdown<string> value={bank} options={BANKS} onChange={setBank} ariaLabel="Bank name" sheetTitle="Select bank" />
            <p className="mt-1.5 text-[11px] text-slate-400 leading-snug">Your salary account from ERP. The amount is paid here and EMIs go through payroll.</p>
          </div>
        </Section>

        <Section title="Bank Signed Cheques Details">
          <div className="flex gap-2.5 p-3 rounded-xl bg-blue-50/70 border-l-[3px] border-[#2F68FE] text-[11.5px] text-slate-600 leading-relaxed">
            <Info className="w-4 h-4 text-[#2F68FE] shrink-0 mt-px" />
            <span>
              Please provide details of 3 bank signed cheques. These signed cheques will be required to be submitted physically to the HR
              Cabin. Kindly ensure that you enter the complete 6-digit signed cheque number while filling in the details (for example:
              000001).
            </span>
          </div>

          {cheques.map((c, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-3 space-y-2.5">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Cheque {i + 1}</span>
              <div data-invalid={Boolean(errors[`cheque-${i}`]) || undefined}>
                <FieldLabel>
                  Cheque Number
                  <Required />
                </FieldLabel>
                <input
                  inputMode="numeric"
                  value={c.number}
                  onChange={(e) => {
                    const number = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCheques((prev) => prev.map((x, j) => (j === i ? { ...x, number } : x)));
                    clear(`cheque-${i}`);
                  }}
                  placeholder="000001"
                  className={`${inputClass} font-mono tracking-widest ${errors[`cheque-${i}`] ? 'border-rose-300' : ''}`}
                />
                <div className="mt-1">
                  <ErrorText message={errors[`cheque-${i}`]} />
                </div>
              </div>
              <FileField
                label={
                  <>
                    Cheque File
                    <Required />
                  </>
                }
                files={c.file ? [c.file] : []}
                error={errors[`chequeFile-${i}`]}
                onChange={(files) => {
                  setCheques((prev) => prev.map((x, j) => (j === i ? { ...x, file: files[0] ?? '' } : x)));
                  clear(`chequeFile-${i}`);
                }}
              />
            </div>
          ))}
        </Section>

        <Section title="Mandatory Documents">
          {docList.map((d) => (
            <FileField
              key={d.label}
              label={
                <>
                  {d.label}
                  <Required />
                </>
              }
              files={documents[d.label] ?? []}
              multiple={d.multiple}
              error={errors[`doc-${d.label}`]}
              onChange={(files) => {
                setDocuments((prev) => ({ ...prev, [d.label]: files }));
                clear(`doc-${d.label}`);
              }}
            />
          ))}
        </Section>
      </div>

      <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
          {initial ? 'Update Request' : 'Submit'}
        </button>
      </div>

      <DatePickerSheet
        isOpen={dateOpen}
        mode="single"
        title="Expected Purchase Date"
        start={purchaseDate || null}
        minDate={today}
        onClose={() => setDateOpen(false)}
        onApply={(iso) => {
          setPurchaseDate(iso);
          clear('purchaseDate');
          setDateOpen(false);
        }}
      />
    </div>
  );
};
