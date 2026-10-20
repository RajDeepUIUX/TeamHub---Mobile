import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, ChevronDown, Clock3, FileText, Info, Loader2, Lock, Sparkles, Upload, X } from 'lucide-react';
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

const Field: React.FC<{ label: React.ReactNode; required?: boolean; error?: string; hint?: string; className?: string; children: React.ReactNode }> = ({
  label,
  required,
  error,
  hint,
  className = '',
  children,
}) => (
  <div className={`min-w-0 space-y-1.5 ${className}`}>
    <span className="flex items-center gap-1 text-[12.5px] font-medium text-[#344054]">
      <span>
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
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

/** Desktop steps are one plain form; groups only space the fields */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-4" aria-label={title}>
    {children}
  </section>
);

/** Desktop "Nothing selected" select before its parent field is chosen */
const EmptySelect: React.FC<{ label: string; placeholder?: string }> = ({ label, placeholder = 'Nothing selected' }) => (
  <div aria-label={label} aria-disabled="true" className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-400 flex items-center justify-between gap-2">
    <span className="truncate">{placeholder}</span>
    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
  </div>
);

const LockedValue: React.FC<{ value: string; placeholder?: string }> = ({ value, placeholder = '-' }) => (
  <div className="w-full h-11 px-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs flex items-center justify-between gap-2" aria-disabled="true">
    <span className={`truncate ${value ? 'font-semibold text-slate-600' : 'font-medium text-slate-400'}`}>{value || placeholder}</span>
    <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
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

  const select = (label: string, value: string | null, options: string[], onChange: (v: string) => void, placeholder = 'Nothing selected') => (
    <Dropdown size="md" ariaLabel={label} sheetTitle={label} value={value} placeholder={placeholder} options={options} onChange={onChange} />
  );

  /* ------------------------------- Step 1 ------------------------------- */
  const core = (
    <section aria-label="Core Details" className="grid grid-cols-2 gap-x-3 gap-y-4">
      <Field label="Hiring Type" required error={errors.hiringType}>
        {isEdit ? <LockedValue value={draft.hiringType} /> : select('Hiring Type', draft.hiringType || null, [HIRING_TYPE], (v) => set('hiringType', v), 'Select')}
      </Field>

      <Field label="Domain" required error={errors.domain}>
        {isEdit ? (
          <LockedValue value={draft.domain} />
        ) : (
          select('Domain', draft.domain || null, REQUIREMENT_DOMAINS.map((d) => d.name), setDomain, 'Select')
        )}
      </Field>

      <Field label="Profile" required error={errors.profile}>
        {isEdit ? (
          <LockedValue value={draft.profile} />
        ) : draft.domain ? (
          select('Profile', draft.profile || null, profilesOfDomain(draft.domain).map((p) => p.name), setProfile)
        ) : (
          <EmptySelect label="Profile" />
        )}
      </Field>

      <Field label="Hours/Week" required error={errors.hoursPerWeek}>
        {isEdit ? (
          <LockedValue value={String(draft.hoursPerWeek)} />
        ) : (
          <Dropdown
            size="md"
            ariaLabel="Hours/Week"
            sheetTitle="Hours/Week"
            value={draft.hoursPerWeek || null}
            placeholder="Nothing selected"
            options={HOURS_OPTIONS}
            onChange={(h) => set('hoursPerWeek', h)}
          />
        )}
      </Field>

      <Field label="Level">
        {isEdit ? <LockedValue value={draft.level} /> : levels.length > 0 ? select('Level', draft.level || null, levels, setLevel) : <EmptySelect label="Level" />}
      </Field>

      <Field label="Tentative Price" required>
        <div className="w-full h-11 px-3.5 rounded-xl bg-[#E9ECEF] border border-slate-200 flex items-center text-xs font-semibold text-[#1E293B]" aria-label="Tentative Price" aria-readonly="true">
          <span className="truncate">{draft.pricing}</span>
        </div>
      </Field>

      <Field label="Budget Hourly Rate" error={errors.budgetRate}>
        <input
          type="text"
          inputMode="decimal"
          value={draft.budgetRate}
          onChange={(e) => set('budgetRate', e.target.value.replace(/[^\d.]/g, ''))}
          placeholder="Budget Hourly Rate"
          aria-label="Budget Hourly Rate"
          aria-invalid={Boolean(errors.budgetRate)}
          className={fieldInputClass(errors.budgetRate)}
        />
      </Field>

      <Field label="Onboarding Timeline" required error={errors.timeline}>
        {isEdit ? (
          <LockedValue value={draft.timeline} />
        ) : (
          select('Onboarding Timeline', draft.timeline || null, TIMELINE_OPTIONS, (v) => set('timeline', v), 'Select Onboarding Timeline')
        )}
      </Field>

      <Field label="Expected Start Date" required error={errors.startDate}>
        {isEdit ? (
          <LockedValue value={draft.startDate ? formatShortDate(draft.startDate) : ''} />
        ) : (
          <button
            type="button"
            onClick={() => setDateOpen(true)}
            aria-label="Expected Start Date"
            aria-invalid={Boolean(errors.startDate)}
            className={`${fieldInputClass(errors.startDate)} flex items-center gap-2 text-left cursor-pointer`}
          >
            <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
            <span className={`truncate ${draft.startDate ? '' : 'text-slate-400'}`}>{draft.startDate ? formatShortDate(draft.startDate) : 'Expected Start Date'}</span>
          </button>
        )}
      </Field>

      <Field label="No. of Staff" required error={errors.staffCount}>
        {isEdit ? (
          <LockedValue value={String(draft.staffCount)} />
        ) : (
          <Dropdown
            size="md"
            ariaLabel="No. of Staff"
            sheetTitle="No. of Staff"
            value={draft.staffCount || null}
            placeholder="Select"
            options={Array.from({ length: REQUIREMENT_STAFF_MAX }, (_, i) => i + 1)}
            onChange={(n) => set('staffCount', n)}
          />
        )}
      </Field>

      <Field label="Preferred Available Upto Time" required error={errors.timezone || errors.availableUpto} className="col-span-2">
        <div className="flex items-stretch">
          <div className="w-[104px] shrink-0 [&_button]:rounded-r-none [&_button]:bg-[#E2E8F0]">
            {select('Time Zone', draft.timezone || null, TIMEZONES, (v) => set('timezone', v), 'Select')}
          </div>
          <button
            type="button"
            onClick={() => setTimeOpen(true)}
            aria-label="Preferred Available Upto Time"
            aria-invalid={Boolean(errors.availableUpto)}
            className={`${fieldInputClass(errors.availableUpto)} -ml-px rounded-l-none flex items-center justify-between gap-2 text-left cursor-pointer`}
          >
            <span className={`truncate tabular-nums ${draft.availableUpto ? '' : 'text-slate-400'}`}>{draft.availableUpto || '--:--'}</span>
            <Clock3 className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </Field>

      <Field label="Work Mode Preference" className="col-span-2">
        {select('Work Mode Preference', draft.workMode, WORK_MODE_OPTIONS, (v) => set('workMode', v as RequirementDraft['workMode']))}
      </Field>

      <div className="col-span-2">
        <MultiSelectDropdown
          label="Offshore Location Preference"
          placeholder="Nothing selected"
          options={OFFSHORE_LOCATIONS.map((l) => ({ value: l, label: l }))}
          selected={draft.locations}
          onChange={(v) => set('locations', v)}
        />
      </div>
    </section>
  );

  /* ------------------------------- Step 2 ------------------------------- */
  const additional = (
    <>
      <Section title="Working Style">
        {yesNo('Do you want staff to directly communicate with your clients?', 'endClientComm')}

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

        <Field label="Does the staff required to travel to US?">
          <Dropdown ariaLabel="Travel to US" value={draft.travelUS || null} placeholder="Select" options={['Yes', 'No', 'Maybe']} onChange={(v) => set('travelUS', v as RequirementDraft['travelUS'])} />
        </Field>
      </Section>

      <Section title="Hiring Process">
        {yesNo('Interview Required?', 'interviewRequired')}
        {yesNo('Technical Assessment Required?', 'technicalAssessment')}
        {domain?.signsTaxReturn && yesNo('Do the staff required to sign Tax Return?', 'signTaxReturn')}
        {domain?.signsAuditReport && yesNo('Do the staff required to sign Audit Report?', 'signAuditReport')}
      </Section>

      <Section title="Skills & Qualifications">
        <MultiSelectDropdown
          label="Type of Task to be Handled"
          placeholder="Select"
          options={TASK_OPTIONS.map((o) => ({ value: o, label: o }))}
          selected={draft.tasks}
          onChange={(v) => set('tasks', v)}
        />
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
      </Section>

      <Section title="Additional Notes">
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
          <p className="px-0.5 text-right text-[11px] text-slate-400 tabular-nums">{draft.additionalNotes.length}/1000</p>
        </Field>
      </Section>
    </>
  );

  /* ------------------------------- Step 3 ------------------------------- */
  const description = (
    <>
      <Section title="Generate with AI">
        <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-[#1D4ED8] leading-snug">
          <Info className="w-4 h-4 shrink-0 mt-px" />
          To generate an AI-powered Job Description, complete: No. of Staff, Domain, Work Mode, Technical Skills and Software Skills
          {Number(draft.level.replace(/\D/g, '')) >= 4 ? ' and Qualification.' : '.'}
        </p>

        <button
          type="button"
          onClick={generate}
          disabled={aiBusy}
          className="w-full h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-wait cursor-pointer"
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
      </Section>

      <Section title="Job Description">
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
      </Section>
    </>
  );

  const lastLabel = isEdit ? 'Update' : 'Submit';

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-white text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-[#2F68FE] h-14 pl-4 pr-3 flex items-center justify-between gap-3">
        <h1 className="text-base font-bold text-white truncate">{isEdit ? 'Edit Requirement' : 'Add Requirement'}</h1>
        <button
          type="button"
          onClick={back}
          aria-label="Close"
          className="w-9 h-9 rounded-lg bg-white/95 text-[#1E293B] flex items-center justify-center active:bg-white shrink-0 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-3 pb-6">
        <RequirementStepper step={step} />
        {step === 1 && !isEdit && (
          <p className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-slate-600 leading-snug">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            To schedule the interview, please provide a few role-specific details. These help us clearly define your hiring requirement, align this candidate
            accurately, and identify any additional suitable candidates for the same role. Once completed, you can proceed to select the interview date and
            available time slots.
          </p>
        )}
        {isEdit && step === 1 && (
          <p className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#FEF8E7] border border-[#FDE68A] text-[11.5px] text-amber-800 leading-snug">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Hiring type, domain, profile, hours, level, timeline, start date and staff count can&rsquo;t be changed. Contact your account manager if they need to change.
          </p>
        )}
        <div className="mt-4 space-y-4">{step === 1 ? core : step === 2 ? additional : description}</div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EBF0F7] px-4 py-3 pb-5 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => setStep((s) => (s - 1) as 1 | 2)}
          disabled={saving || step === 1}
          className="h-11 min-w-[104px] px-4 rounded-lg border border-[#2F68FE]/50 text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={next}
          disabled={saving || aiBusy}
          className="h-11 min-w-[104px] px-4 rounded-lg bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-wait cursor-pointer"
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

