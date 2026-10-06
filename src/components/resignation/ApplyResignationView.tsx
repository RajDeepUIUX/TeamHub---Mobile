import React, { useRef, useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, Paperclip, X, Check, Wand2, Info, FileText } from 'lucide-react';
import { SelectReasonsSheet } from './SelectReasonsSheet';
import {
  ACCEPTED_ATTACHMENTS,
  NOTICE_PERIOD_DAYS,
  REPORTING_MANAGER,
  RESIGNATION_EMAIL_TEMPLATE,
  TERMS_TEXT,
  formatResignationDate,
  lastWorkingDateFor,
  toISODate,
} from '../../data/resignationData';

export interface ResignationFormData {
  resignationDate: string;
  lastWorkingDate: string;
  reasons: string[];
  emailContent: string;
  attachments: string[];
}

interface ApplyResignationViewProps {
  employeeName: string;
  onBack: () => void;
  onSubmit: (data: ResignationFormData) => void;
}

const MAX_EMAIL_CHARS = 2000;

export const ApplyResignationView: React.FC<ApplyResignationViewProps> = ({ employeeName, onBack, onSubmit }) => {
  // Resignation date is always today and cannot be changed
  const resignationDate = toISODate(new Date());
  const lastWorkingDate = lastWorkingDateFor(resignationDate);

  const [reasons, setReasons] = useState<string[]>([]);
  const [emailContent, setEmailContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [isReasonsOpen, setIsReasonsOpen] = useState(false);
  const [errors, setErrors] = useState<{ reasons?: string; email?: string; agreed?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emailTemplate = RESIGNATION_EMAIL_TEMPLATE(REPORTING_MANAGER, formatResignationDate(lastWorkingDate), employeeName);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(e.target.files ?? []).map((f) => f.name);
    e.target.value = '';
    if (names.length) setAttachments((prev) => [...prev, ...names.filter((n) => !prev.includes(n))]);
  };

  const quickFill = () => {
    setReasons(['Better Opportunity', 'Relocation']);
    setEmailContent(emailTemplate);
    setAgreed(true);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (reasons.length === 0) next.reasons = 'Select at least one reason.';
    if (!emailContent.trim()) next.email = 'Write your resignation email.';
    if (!agreed) next.agreed = 'Please accept the terms to continue.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setTimeout(
      () => onSubmit({ resignationDate, lastWorkingDate, reasons, emailContent: emailContent.trim(), attachments }),
      700
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center justify-between h-14 px-4 relative">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold screen-title screen-title-tight">Apply for Resignation</h1>
          </div>
          <button
            type="button"
            onClick={quickFill}
            className="h-8 px-2.5 rounded-full bg-indigo-50 text-[#4F46E5] text-[11px] font-semibold flex items-center gap-1 active:bg-indigo-100 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Quick Fill
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col" noValidate>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {/* Dates */}
          <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="p-3.5">
                <span className="block text-[11px] font-semibold text-slate-500">
                  Resignation Date <span className="text-rose-500">*</span>
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-[#1E293B]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatResignationDate(resignationDate)}
                </span>
              </div>
              <div className="p-3.5">
                <span className="block text-[11px] font-semibold text-slate-500">Last Working Day</span>
                <span className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-[#1E293B]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatResignationDate(lastWorkingDate)}
                </span>
              </div>
            </div>
            <div className="px-3.5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Based on a {NOTICE_PERIOD_DAYS}-day notice period, starting today.
            </div>
          </section>

          {/* Reasons (multi-select) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E293B]">
              Reason <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsReasonsOpen(true)}
              className={`w-full min-h-12 px-3.5 py-2 bg-white border rounded-xl flex items-center gap-2 text-left shadow-2xs transition-colors cursor-pointer ${
                errors.reasons ? 'border-rose-300' : 'border-slate-200'
              }`}
            >
              <span className="flex-1 min-w-0">
                {reasons.length === 0 ? (
                  <span className="text-xs font-medium text-slate-400">Select one or more reasons</span>
                ) : (
                  <span className="flex flex-wrap gap-1.5">
                    {reasons.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-blue-50 text-[#2F68FE] text-[11px] font-semibold"
                      >
                        {r}
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Remove ${r}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReasons((prev) => prev.filter((x) => x !== r));
                          }}
                          className="w-4 h-4 rounded flex items-center justify-center active:bg-blue-100"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
            {errors.reasons && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.reasons}</p>}
          </div>

          {/* Email content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1E293B]">
                Email Content <span className="text-rose-500">*</span>
              </label>
              {!emailContent && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailContent(emailTemplate);
                    setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className="text-[11px] font-semibold text-[#2F68FE] flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Use template
                </button>
              )}
            </div>
            <div className="relative">
              <textarea
                rows={8}
                value={emailContent}
                maxLength={MAX_EMAIL_CHARS}
                onChange={(e) => {
                  setEmailContent(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="Write your resignation email to your reporting manager..."
                className={`w-full p-3.5 pb-7 bg-white border rounded-xl text-xs leading-relaxed font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none shadow-2xs ${
                  errors.email ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 pointer-events-none tabular-nums">
                {emailContent.length}/{MAX_EMAIL_CHARS}
              </span>
            </div>
            {errors.email && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.email}</p>}
          </div>

          {/* Attachments */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E293B]">
              File Upload <span className="font-medium text-slate-400">(Optional)</span>
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-blue-200 bg-blue-50/20 rounded-2xl p-3.5 flex items-center gap-3 text-left active:bg-blue-50/60 transition-colors cursor-pointer"
            >
              <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F68FE] shrink-0">
                <Paperclip className="w-4.5 h-4.5" />
              </span>
              <span>
                <span className="block text-xs font-bold text-[#2F68FE]">Add files</span>
                <span className="block text-[11px] text-slate-400">PDF, DOC, PPT, JPG, PNG</span>
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_ATTACHMENTS}
              className="hidden"
              onChange={handleFiles}
            />
            {attachments.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {attachments.map((name) => (
                  <li
                    key={name}
                    className="flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-100 rounded-xl text-xs"
                  >
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="flex-1 min-w-0 truncate font-medium text-slate-700">{name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((n) => n !== name))}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
                      aria-label={`Remove ${name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Terms */}
          <div>
            <button
              type="button"
              onClick={() => {
                setAgreed((v) => !v);
                if (errors.agreed) setErrors((p) => ({ ...p, agreed: undefined }));
              }}
              aria-pressed={agreed}
              className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                errors.agreed ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-white'
              }`}
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  agreed ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {agreed && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className="text-[11.5px] text-slate-600 leading-relaxed">{TERMS_TEXT}</span>
            </button>
            {errors.agreed && <p className="mt-1.5 px-0.5 text-[11px] font-medium text-rose-500">{errors.agreed}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 grid grid-cols-2 gap-3 p-4 pb-5 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={onBack}
            className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>

      <SelectReasonsSheet
        isOpen={isReasonsOpen}
        selected={reasons}
        onClose={() => setIsReasonsOpen(false)}
        onApply={(next) => {
          setReasons(next);
          setIsReasonsOpen(false);
          if (next.length && errors.reasons) setErrors((p) => ({ ...p, reasons: undefined }));
        }}
      />
    </div>
  );
};
