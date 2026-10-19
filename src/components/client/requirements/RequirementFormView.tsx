import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, CalendarDays, Clock3, FileText, Info, Loader2, Lock, Minus, Plus, Sparkles, Upload, X } from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { DatePickerSheet } from '../../common/DatePickerSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { TimeWheelSheet } from '../../common/TimeWheelSheet';
import { ConfirmSheet, fieldInputClass } from '../staff/tabs/StaffTabParts';
import { formatShortDate, isoOfDate } from '../data/clientInterviewsData';
import {
  BUDGET_RATE_MIN,
  COMMUNICATION_OPTIONS,
  DraftErrors,
  HIRING_TYPE,
  HOURS_OPTIONS,
  OFFSHORE_LOCATIONS,
  OVERTIME_OPTIONS,
  QUALIFICATION_OPTIONS,
  REPORTING_OPTIONS,
  REQUIREMENT_DOMAINS,
  REQUIREMENT_STAFF_MAX,
  RequirementDraft,
  StaffRequirement,
  TASK_OPTIONS,
  TIMELINE_OPTIONS,
  TIMEZONES,
  WORK_MODE_OPTIONS,
  domainSpecOf,
  formatTime12,
  generateJobDescription,
  levelsOfProfile,
  missingForAi,
  profilesOfDomain,
  tentativePricing,
  validateCore,
} from '../data/clientRequirementsData';
import { RequirementStepper } from './RequirementParts';

interface Props {
  /** Present when editing: domain, profile, hours, level, timeline, start date and staff count are locked (desktop update ignores them) */
  editing: StaffRequirement | null;
  initial: RequirementDraft;
  onBack: () => void;
  onSubmit: (draft: RequirementDraft) => void;
}

const JD_ACCEPT = '.pdf,.docx,.jpg,.jpeg,.png';
const JD_MAX_MB = 5;
const AI_MS = 1200;
const SAVE_MS = 800;

const Field: React.FC<{ label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }> = ({ label, required, error, hint, children }) => (
  <div className="space-y-1.5">
    <span className="block text-xs font-bold text-[#1E293B]">
      {label}
      {required && <span className="text-rose-500"> *</span>}
    </span>
    {children}
    {hint && !error && <p className="px-0.5 text-[11px] text-slate-400">{hint}</p>}
    {error && (
      <p className="px-0.5 text-[11px] font-medium text-rose-500" role="alert">
        {error}
      </p>
    )}
  </div>
);

const LockedValue: React.FC<{ value: string; placeholder?: string }> = ({ value, placeholder = '-' }) => (
  <div className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-between gap-2" aria-disabled="true">
    <span className="truncate">{value || placeholder}</span>
    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
  </div>
);

const textareaClass =
  'w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 leading-relaxed focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text';

/** Desktop "Add Requirement" / "Edit Requirement" offcanvas: Core Details → Additional Details → Job Description */
export const RequirementFormView: React.FC<Props> = ({ editing, initial, onBack, onSubmit }) => {
  const [draft, setDraft] = useState<RequirementDraft>(initial);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMissing, setAiMissing] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isEdit = Boolean(editing);
  const domain = domainSpecOf(draft.domain);
  const levels = draft.profile ? levelsOfProfile(draft.domain, draft.profile) : [];
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const set = <K extends keyof RequirementDraft>(key: K, value: RequirementDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const setDomain = (name: string) =>
    setDraft((d) => ({
      ...d,
      domain: name,
      profile: '',
      level: '',
      pricing: '',
      software: [],
      skills: [],
      signTaxReturn: '',
      signAuditReport: '',
    }));

  const setProfile = (name: string) => {
    const options = levelsOfProfile(draft.domain, name);
    const level = options.length === 1 ? options[0] : '';
    setDraft((d) => ({ ...d, profile: name, level, pricing: level ? tentativePricing(d.domain, level) : '' }));
    setErrors((e) => ({ ...e, profile: undefined }));
  };

  const setLevel = (level: string) => setDraft((d) => ({ ...d, level, pricing: tentativePricing(d.domain, level) }));

  const back = () => (dirty && !saving ? setDiscardOpen(true) : onBack());

  const next = () => {
    if (step === 1) {
      const e = validateCore(draft);
      setErrors(e);
      if (Object.keys(e).length) {
        requestAnimationFrame(() => bodyRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      setSaving(true);
      later(() => onSubmit(draft), SAVE_MS);
    }
  };

  const generate = () => {
    const missing = missingForAi(draft);
    setAiMissing(missing);
    if (missing.length) return;
    setAiBusy(true);
    later(() => {
      set('jobDescription', generateJobDescription(draft));
      setAiBusy(false);
    }, AI_MS);
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['pdf', 'docx', 'jpg', 'jpeg', 'png'].includes(ext)) {
      setFileError('Upload a PDF, DOCX, JPG or PNG file.');
      return;
    }
    if (file.size > JD_MAX_MB * 1024 * 1024) {
      setFileError(`File is larger than ${JD_MAX_MB} MB.`);
      return;
    }
    setFileError('');
    setFileName(file.name);
    setAiBusy(true);
    // Desktop reads the file text on the server (`uploadJDfile`); the prototype fills the box from the entered details
    later(() => {
      set('jobDescription', generateJobDescription(draft));
      setAiBusy(false);
    }, AI_MS);
  };

  const yesNo = (label: string, key: 'endClientComm' | 'interviewRequired' | 'technicalAssessment' | 'signTaxReturn' | 'signAuditReport') => (
    <Field label={label}>
      <Dropdown
        ariaLabel={label}
        value={draft[key] || null}
        placeholder="Select"
        options={['Yes', 'No']}
        onChange={(v) => set(key, v as RequirementDraft[typeof key])}
      />
    </Field>
  );

  const stepper = (n: number) => (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => set('staffCount', Math.max(1, n - 1))}
        disabled={n <= 1}
        aria-label="Decrease staff count"
        className="w-11 h-11 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center active:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="min-w-10 text-center text-base font-extrabold text-[#1E293B] tabular-nums" aria-live="polite">
        {n}
      </span>
      <button
        type="button"
        onClick={() => set('staffCount', Math.min(REQUIREMENT_STAFF_MAX, n + 1))}
        disabled={n >= REQUIREMENT_STAFF_MAX}
        aria-label="Increase staff count"
        className="w-11 h-11 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center active:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );

  const dateButton = (
    <button
      type="button"
      onClick={() => setDateOpen(true)}
      aria-label="Expected Start Date"
      aria-invalid={Boolean(errors.startDate)}
      className={`${fieldInputClass(errors.startDate)} flex items-center justify-between gap-2 text-left cursor-pointer`}
    >
      <span className={`truncate ${draft.startDate ? '' : 'text-slate-400'}`}>{draft.startDate ? formatShortDate(draft.startDate) : 'Select date'}</span>
      <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
    </button>
  );

  /* ------------------------------- Step 1 ------------------------------- */
  const core = (
    <div className="space-y-4">
      <Field label="Hiring Type" required>
        <LockedValue value={HIRING_TYPE} />
      </Field>

      <Field label="Domain" required error={errors.domain}>
        {isEdit ? (
          <LockedValue value={draft.domain} />
        ) : (
          <Dropdown ariaLabel="Domain" sheetTitle="Domain" value={draft.domain || null} placeholder="Select domain" options={REQUIREMENT_DOMAINS.map((d) => d.name)} onChange={setDomain} />
        )}
      </Field>

      <Field label="Profile" required error={errors.profile}>
        {isEdit ? (
          <LockedValue value={draft.profile} />
        ) : draft.domain ? (
          <Dropdown
            ariaLabel="Profile"
            sheetTitle="Profile"
            value={draft.profile || null}
            placeholder="Select profile"
            options={profilesOfDomain(draft.domain).map((p) => p.name)}
            onChange={setProfile}
          />
        ) : (
          <LockedValue value="" placeholder="Select a domain first" />
        )}
      </Field>

      <Field label="Hours/Week" required error={errors.hoursPerWeek}>
        {isEdit ? (
          <LockedValue value={`${draft.hoursPerWeek} Hours/Week`} />
        ) : (
          <Dropdown
            ariaLabel="Hours per week"
            sheetTitle="Hours/Week"
            value={draft.hoursPerWeek || null}
            placeholder="Select hours"
            options={HOURS_OPTIONS.map((h) => ({ value: h, label: h === 40 ? '40 Hours/Week (Full time)' : `${h} Hours/Week` }))}
            onChange={(h) => set('hoursPerWeek', h)}
          />
        )}
      </Field>

      <Field label="Level">
        {isEdit ? (
          <LockedValue value={draft.level} />
        ) : levels.length > 0 ? (
          <Dropdown ariaLabel="Level" sheetTitle="Level" value={draft.level || null} placeholder="Select level" options={levels} onChange={setLevel} />
        ) : (
          <LockedValue value="" placeholder="Select a profile first" />
        )}
      </Field>

      <Field label="Tentative Price" required hint="Based on the profile and level. Final pricing is confirmed by your account manager.">
        <LockedValue value={draft.pricing} placeholder="Shown once a level is selected" />
      </Field>

      <Field label="Budget Hourly Rate" error={errors.budgetRate} hint={`Optional. Minimum $${BUDGET_RATE_MIN}.`}>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={draft.budgetRate}
            onChange={(e) => set('budgetRate', e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="Budget Hourly Rate"
            aria-label="Budget Hourly Rate"
            aria-invalid={Boolean(errors.budgetRate)}
            className={`${fieldInputClass(errors.budgetRate)} pl-7`}
          />
        </div>
      </Field>

      <Field label="Onboarding Timeline" required error={errors.timeline}>
        {isEdit ? (
          <LockedValue value={draft.timeline} />
        ) : (
          <Dropdown ariaLabel="Onboarding Timeline" value={draft.timeline || null} placeholder="Select timeline" options={TIMELINE_OPTIONS} onChange={(v) => set('timeline', v)} />
        )}
      </Field>

      <Field label="Expected Start Date" required error={errors.startDate}>
        {isEdit ? <LockedValue value={draft.startDate ? formatShortDate(draft.startDate) : ''} /> : dateButton}
      </Field>

      <Field label="No. of Staff" required hint={isEdit ? undefined : 'One requirement is created for each staff.'}>
        {isEdit ? <LockedValue value={String(draft.staffCount)} /> : stepper(draft.staffCount)}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Time Zone" required error={errors.timezone}>
          <Dropdown ariaLabel="Time zone" sheetTitle="Time Zone" value={draft.timezone || null} placeholder="Select" options={TIMEZONES} onChange={(v) => set('timezone', v)} />
        </Field>
        <Field label="Available Upto" required error={errors.availableUpto}>
          <button
            type="button"
            onClick={() => setTimeOpen(true)}
            aria-label="Preferred Available Upto Time"
            aria-invalid={Boolean(errors.availableUpto)}
            className={`${fieldInputClass(errors.availableUpto)} flex items-center justify-between gap-2 text-left cursor-pointer`}
          >
            <span className={`truncate ${draft.availableUpto ? '' : 'text-slate-400'}`}>{draft.availableUpto ? formatTime12(draft.availableUpto) : 'Select time'}</span>
            <Clock3 className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </Field>
      </div>

      <Field label="Work Mode Preference">
        <Dropdown ariaLabel="Work Mode Preference" value={draft.workMode} options={WORK_MODE_OPTIONS} onChange={(v) => set('workMode', v)} />
      </Field>

      <MultiSelectDropdown
        label="Offshore Location Preference"
        placeholder="Select locations"
        options={OFFSHORE_LOCATIONS.map((l) => ({ value: l, label: l }))}
        selected={draft.locations}
        onChange={(v) => set('locations', v)}
      />
    </div>
  );

  /* ------------------------------- Step 2 ------------------------------- */
  const additional = (
    <div className="space-y-4">
      {yesNo('Do you want staff to directly communicate with your clients?', 'endClientComm')}

      <div className="space-y-1.5">
        <span className="block text-xs font-bold text-[#1E293B]">Overtime Requirement</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-slate-500">Seasonal</span>
            <Dropdown ariaLabel="Seasonal overtime" value={draft.overtimeSeasonal || null} placeholder="Select" options={OVERTIME_OPTIONS} onChange={(v) => set('overtimeSeasonal', v)} />
          </div>
          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-slate-500">ROY</span>
            <Dropdown ariaLabel="ROY overtime" value={draft.overtimeRoy || null} placeholder="Select" options={OVERTIME_OPTIONS} onChange={(v) => set('overtimeRoy', v)} />
          </div>
        </div>
      </div>

      {yesNo('Interview Required?', 'interviewRequired')}

      <Field label="Reporting To">
        <Dropdown ariaLabel="Reporting To" value={draft.reportingTo || null} placeholder="Select" options={REPORTING_OPTIONS} onChange={(v) => set('reportingTo', v)} />
      </Field>

      <MultiSelectDropdown
        label="Expected Communication Involvement"
        placeholder="Select"
        options={COMMUNICATION_OPTIONS.map((o) => ({ value: o, label: o }))}
        selected={draft.communication}
        onChange={(v) => set('communication', v)}
      />
      <MultiSelectDropdown
        label="Type of Task to be Handled"
        placeholder="Select"
        options={TASK_OPTIONS.map((o) => ({ value: o, label: o }))}
        selected={draft.tasks}
        onChange={(v) => set('tasks', v)}
      />

      <Field label="Does the staff required to travel to US?">
        <Dropdown ariaLabel="Travel to US" value={draft.travelUS || null} placeholder="Select" options={['Yes', 'No', 'Maybe']} onChange={(v) => set('travelUS', v as RequirementDraft['travelUS'])} />
      </Field>

      {yesNo('Technical Assessment Required?', 'technicalAssessment')}
      {domain?.signsTaxReturn && yesNo('Do the staff required to sign Tax Return?', 'signTaxReturn')}
      {domain?.signsAuditReport && yesNo('Do the staff required to sign Audit Report?', 'signAuditReport')}

      <MultiSelectDropdown
        label="Are there any Specific Software requirements?"
        placeholder={domain ? 'Select software' : 'Select a domain first'}
        options={(domain?.software ?? []).map((o) => ({ value: o, label: o }))}
        selected={draft.software}
        onChange={(v) => set('software', v)}
        searchable
        disabled={!domain}
      />
      <MultiSelectDropdown
        label="Are there any Specific Technical Skills you’re looking for?"
        placeholder={domain ? 'Select skills' : 'Select a domain first'}
        options={(domain?.skills ?? []).map((o) => ({ value: o, label: o }))}
        selected={draft.skills}
        onChange={(v) => set('skills', v)}
        searchable
        disabled={!domain}
      />
      <MultiSelectDropdown
        label="Are there any Specific Qualifications you’re looking for?"
        placeholder="Select qualifications"
        options={QUALIFICATION_OPTIONS.map((o) => ({ value: o, label: o }))}
        selected={draft.qualifications}
        onChange={(v) => set('qualifications', v)}
      />

      <Field label="Anything specific you would like to add">
        <textarea
          rows={4}
          value={draft.additionalNotes}
          onChange={(e) => set('additionalNotes', e.target.value)}
          maxLength={1000}
          placeholder="Add any other requirements or context"
          aria-label="Anything specific you would like to add"
          className={textareaClass}
        />
      </Field>
    </div>
  );

  /* ------------------------------- Step 3 ------------------------------- */
  const description = (
    <div className="space-y-4">
      <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-[#1D4ED8] leading-snug">
        <Info className="w-4 h-4 shrink-0 mt-px" />
        To generate an AI-powered Job Description, complete: No. of Staff, Domain, Work Mode, Technical Skills and Software Skills
        {Number(draft.level.replace(/\D/g, '')) >= 4 ? ' and Qualification.' : '.'}
      </p>

      <button
        type="button"
        onClick={generate}
        disabled={aiBusy}
        className="w-full h-11 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-2 active:bg-blue-100 disabled:opacity-60 disabled:cursor-wait cursor-pointer"
      >
        {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {aiBusy ? 'Preparing…' : draft.jobDescription ? 'Regenerate with AI' : 'Generate with AI'}
      </button>
      {aiMissing.length > 0 && (
        <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[11.5px] text-rose-600 leading-snug" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>Complete these first: {aiMissing.join(', ')}.</span>
        </p>
      )}

      <div className="space-y-1.5">
        <span className="block text-xs font-bold text-[#1E293B]">Upload Job Description</span>
        <input ref={fileRef} type="file" accept={JD_ACCEPT} className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
        {fileName ? (
          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-[#FEF2F2] text-rose-500 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0 text-[12px] font-bold text-[#1E293B] truncate">{fileName}</span>
            <button
              type="button"
              onClick={() => setFileName('')}
              aria-label="Remove file"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={aiBusy}
            className="w-full py-5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center gap-1 active:bg-slate-100 disabled:opacity-60 cursor-pointer"
          >
            <Upload className="w-5 h-5 text-[#2F68FE]" />
            <span className="text-xs font-bold text-[#2F68FE]">Choose a file</span>
            <span className="text-[11px] text-slate-400">PDF, DOCX, JPG or PNG · up to {JD_MAX_MB} MB</span>
          </button>
        )}
        {fileError && (
          <p className="px-0.5 text-[11px] font-medium text-rose-500" role="alert">
            {fileError}
          </p>
        )}
      </div>

      <Field label="Job Description">
        <textarea
          rows={10}
          value={draft.jobDescription}
          onChange={(e) => set('jobDescription', e.target.value)}
          placeholder="Describe the role, or generate / upload one above"
          aria-label="Job Description"
          className={textareaClass}
        />
      </Field>
    </div>
  );

  const lastLabel = isEdit ? 'Update' : 'Submit';

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        <button type="button" onClick={back} aria-label="Back to Staff Requirements" className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold screen-title">{isEdit ? 'Edit Requirement' : 'Add Requirement'}</h1>
      </header>
      <RequirementStepper step={step} />

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-4 pb-6">
        {isEdit && step === 1 && (
          <p className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#FEF8E7] border border-[#FDE68A] text-[11.5px] text-amber-800 leading-snug">
            <Lock className="w-4 h-4 shrink-0 mt-px" />
            Domain, profile, hours, level, timeline, start date and staff count can&rsquo;t be changed. Contact your account manager if they need to change.
          </p>
        )}
        <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-4">{step === 1 ? core : step === 2 ? additional : description}</div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 pb-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => (step === 1 ? back() : setStep((s) => (s - 1) as 1 | 2))}
          disabled={saving}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 disabled:opacity-50 cursor-pointer"
        >
          {step === 1 ? 'Cancel' : 'Previous'}
        </button>
        <button
          type="button"
          onClick={next}
          disabled={saving || aiBusy}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-wait cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : step === 3 ? lastLabel : 'Next'}
        </button>
      </div>

      <DatePickerSheet
        isOpen={dateOpen}
        mode="single"
        title="Expected Start Date"
        start={draft.startDate || null}
        minDate={isoOfDate(new Date())}
        onClose={() => setDateOpen(false)}
        onApply={(iso) => {
          set('startDate', iso);
          setDateOpen(false);
        }}
      />
      <TimeWheelSheet
        isOpen={timeOpen}
        title="Preferred Available Upto Time"
        value={draft.availableUpto}
        step={15}
        onClose={() => setTimeOpen(false)}
        onApply={(v) => {
          set('availableUpto', v);
          setTimeOpen(false);
        }}
      />
      <ConfirmSheet
        isOpen={discardOpen}
        title="Discard Changes?"
        message={isEdit ? 'Your edits to this requirement will be lost.' : 'The requirement you started will not be saved.'}
        confirmLabel="Discard"
        danger
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          onBack();
        }}
      />
    </div>
  );
};

