import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  FileBarChart,
  Globe,
  GraduationCap,
  Award,
  Laptop,
  MessageSquareText,
  Wrench,
  Lock,
  Plus,
  Info,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { DatePickerSheet } from '../common/DatePickerSheet';
import { MultiSelectSheet } from '../common/MultiSelectSheet';
import { todayIso } from '../common/DateWheelSheet';
import { Dropdown } from '../../design-system/components/Dropdown';
import { AdditionalResponsibilitiesTab, cleanAdditional, validateAdditional } from './AdditionalResponsibilitiesTab';
import { DateButton, ErrorText, FieldLabel, formatReviewDate, inputClass, textareaClass } from './reviewFormParts';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';
import {
  AnnualReviewForm,
  CURRENT_QUALIFICATIONS,
  DOMAINS,
  FutureQualification,
  QUALIFICATIONS,
  QUALIFICATION_STATUSES,
  SKILL_SECTION_INFO,
  RATING_PARAMETERS,
  REVIEW_IMPORTANT_NOTES,
  REVIEW_INSTRUCTIONS_CLOSING,
  REVIEW_INSTRUCTIONS_INTRO,
  REVIEW_INSTRUCTION_SECTIONS,
  ReviewCycle,
  SKILL_LEVELS,
  SOFTWARE,
  SkillLevel,
  SkillRow,
  TECHNICAL_SKILLS,
  emptyReviewForm,
  newSkillRow,
  softwareCategory,
} from '../../data/annualReviewData';

interface AnnualReviewViewProps {
  cycles: ReviewCycle[];
  /** Back to the Staff Review performance report */
  onBack: () => void;
  onSaveDraft: (cycleId: string, form: AnnualReviewForm) => void;
  onSubmit: (cycleId: string, form: AnnualReviewForm) => void;
}

type ListKey = 'technical' | 'software' | 'domain';
type Errors = Record<string, string>;

const cycleLabel = (id: string) => id.replace('-', ' ');

const isBlank = (r: SkillRow, needsItem: boolean) => !(needsItem && r.item) && !r.current && !r.future && !r.remarks.trim();
const isComplete = (r: SkillRow, needsItem: boolean) => (!needsItem || Boolean(r.item)) && Boolean(r.current) && Boolean(r.future);

const LIST_META: Record<ListKey, { title: string; noun: string; options: string[] }> = {
  technical: { title: 'Technical Skills', noun: 'Technical skill', options: TECHNICAL_SKILLS },
  software: { title: 'Software Expertise', noun: 'Software', options: SOFTWARE.map((s) => s.name) },
  domain: { title: 'Overall Domain Understanding', noun: 'Domain', options: DOMAINS },
};

/** Drop untouched rows and validate the rest */
const validate = (form: AnnualReviewForm): Errors => {
  const errors: Errors = {};
  (['technical', 'software', 'domain'] as ListKey[]).forEach((key) => {
    form[key].forEach((r) => {
      if (!isBlank(r, true) && !isComplete(r, true)) errors[r.id] = `Pick a ${LIST_META[key].noun.toLowerCase()}, current level and future level.`;
    });
  });
  if (!form.technical.some((r) => isComplete(r, true))) {
    const first = form.technical[0];
    if (first && !errors[first.id]) errors[first.id] = 'Rate at least one technical skill.';
  }
  if (!isComplete(form.communication, false)) errors.communication = 'Pick your current and future level.';
  form.futureQualifications.forEach((q) => {
    if (q.status === 'Completed' ? !q.completionDate : !q.targetDate)
      errors[`qual-${q.name}`] = q.status === 'Completed' ? 'Add the date you completed it.' : 'Add a targeted date of completion.';
  });
  return errors;
};

const clean = (form: AnnualReviewForm): AnnualReviewForm => ({
  ...form,
  technical: form.technical.filter((r) => !isBlank(r, true)),
  software: form.software.filter((r) => !isBlank(r, true)),
  domain: form.domain.filter((r) => !isBlank(r, true)),
  additional: cleanAdditional(form.additional),
});

const isResponsibilityError = (key: string) => key.startsWith('resp-');

/* ---------------------------------- Pieces ---------------------------------- */

const SectionCard: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
  done?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, done, action, children }) => {
  const info = SKILL_SECTION_INFO[title];
  const [infoOpen, setInfoOpen] = useState(false);
  return (
  <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
    <div className="flex items-center gap-3 p-3.5 pb-3">
      <span className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-[#1E293B] leading-snug">{title}</span>
          {info && (
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="w-5 h-5 -m-0.5 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 shrink-0 cursor-pointer"
              aria-label={`About ${title}`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
          {done && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
        </span>
        <span className="block text-[11px] text-slate-400 leading-snug">{subtitle}</span>
      </span>
      {action}
    </div>
    <div className="px-3.5 pb-3.5 space-y-2.5">{children}</div>

    {info && (
      <BottomSheet isOpen={infoOpen} onClose={() => setInfoOpen(false)} maxHeight="max-h-[50%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-6">
          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-[#1E293B] leading-snug pt-1.5">{title}</h2>
          </div>
          <p className="mt-2.5 text-[12.5px] text-slate-600 leading-relaxed">{info}</p>
          <button
            type="button"
            onClick={() => setInfoOpen(false)}
            className="mt-5 w-full h-11 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold active:bg-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </BottomSheet>
    )}
  </section>
  );
};

const LevelFields: React.FC<{ row: SkillRow; onChange: (patch: Partial<SkillRow>) => void }> = ({ row, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    <div className="min-w-0">
      <FieldLabel>Current Level</FieldLabel>
      <Dropdown<SkillLevel>
        value={row.current || null}
        options={SKILL_LEVELS}
        onChange={(v) => onChange({ current: v })}
        placeholder="Select level"
        ariaLabel="Current level"
      />
    </div>
    <div className="min-w-0">
      <FieldLabel>Future (next 12 months)</FieldLabel>
      <Dropdown<SkillLevel>
        value={row.future || null}
        options={SKILL_LEVELS}
        onChange={(v) => onChange({ future: v })}
        placeholder="Select level"
        ariaLabel="Future level"
      />
    </div>
  </div>
);

const RemarksField: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div>
    <FieldLabel>Remarks (optional)</FieldLabel>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      maxLength={300}
      placeholder="Write a note"
      className={textareaClass}
    />
  </div>
);

/** Read-only summary of a rated row (submitted cycles) */
const RatedRow: React.FC<{ title?: string; meta?: string; row: SkillRow }> = ({ title, meta, row }) => (
  <div className="rounded-xl border border-slate-100 p-3">
    {title && (
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold text-[#1E293B]">{title}</span>
        {meta && <span className="text-[10.5px] text-slate-400 shrink-0">{meta}</span>}
      </div>
    )}
    <div className={`flex items-center gap-1.5 text-[11px] ${title ? 'mt-1.5' : ''}`}>
      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">{row.current || '—'}</span>
      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#4F46E5] font-semibold">{row.future || '—'}</span>
      <span className="text-[10px] text-slate-400">in 12 months</span>
    </div>
    {row.remarks && <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">“{row.remarks}”</p>}
  </div>
);

/* --------------------------------- Sheets ---------------------------------- */

const ConfirmSheet: React.FC<{
  isOpen: boolean;
  title: string;
  body: string;
  onClose: () => void;
  actions: { label: string; onClick: () => void; tone: 'primary' | 'secondary' | 'danger' }[];
}> = ({ isOpen, title, body, onClose, actions }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[60%]">
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="px-5 pt-2 pb-6">
      <h2 className="text-base font-bold text-[#1E293B]">{title}</h2>
      <p className="mt-1.5 text-[12.5px] text-slate-500 leading-relaxed">{body}</p>
      <div className="mt-5 space-y-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={`w-full h-11 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              a.tone === 'primary'
                ? 'bg-[#2F68FE] text-white active:bg-[#1D4ED8]'
                : a.tone === 'danger'
                  ? 'bg-rose-50 text-rose-600 active:bg-rose-100'
                  : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  </BottomSheet>
);

const LEVEL_TONES: Record<SkillLevel, string> = {
  Basic: 'bg-slate-100 text-slate-600',
  Average: 'bg-sky-50 text-sky-600',
  Intermediate: 'bg-indigo-50 text-[#4F46E5]',
  Advance: 'bg-violet-50 text-violet-600',
  Expert: 'bg-emerald-50 text-emerald-600',
};

const InstructionsSheet: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<'guide' | 'ratings'>('guide');
  const scrollRef = useRef<HTMLDivElement>(null);
  // Each tab starts at the top, whether switched from the tabs or the "How does Rating Parameters work?" link
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [view]);
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="px-5 pt-2 pb-3 shrink-0 border-b border-slate-100 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">Instructions</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Team Member Annual Review</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <SegmentedTabs
          ariaLabel="Instructions view"
          value={view}
          onChange={setView}
          options={[
            { id: 'guide', label: 'Guide' },
            { id: 'ratings', label: 'Rating Levels' },
          ]}
        />
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 text-[12.5px] text-slate-600 leading-relaxed">
        {view === 'guide' ? (
          <div className="space-y-4">
            {/* Deadline & saving first — the two things people most need to know */}
            <section className="rounded-xl bg-amber-50 border border-amber-100 p-3">
              <h3 className="flex items-center gap-1.5 text-[12.5px] font-bold text-amber-800">
                <AlertCircle className="w-4 h-4" />
                Important
              </h3>
              <ul className="mt-1.5 space-y-1.5">
                {REVIEW_IMPORTANT_NOTES.map((n) => (
                  <li key={n} className="flex gap-2 text-[12px] text-amber-900/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-[7px] shrink-0" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </section>

            <p>{REVIEW_INSTRUCTIONS_INTRO}</p>

            {REVIEW_INSTRUCTION_SECTIONS.map((s) => (
              <section key={s.title} className="space-y-1">
                <h3 className="text-[13px] font-bold text-[#1E293B]">{s.title}</h3>
                <p>{s.body}</p>
              </section>
            ))}

            <p className="italic text-slate-500">{REVIEW_INSTRUCTIONS_CLOSING}</p>

            <button
              type="button"
              onClick={() => setView('ratings')}
              className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-indigo-50 text-[#4F46E5] text-xs font-bold active:bg-indigo-100 cursor-pointer"
            >
              How does Rating Parameters work?
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <h3 className="text-[13px] font-bold text-[#1E293B]">How does Rating Parameters work?</h3>
            {RATING_PARAMETERS.map((group) => (
              <section key={group.title}>
                <h4 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</h4>
                <ul className="rounded-xl border border-slate-100 divide-y divide-slate-100">
                  {SKILL_LEVELS.map((level) => (
                    <li key={level} className="px-3 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-bold ${LEVEL_TONES[level]}`}>{level}</span>
                      <p className="mt-1 text-[12px]">{group.levels[level]}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 pb-5 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </BottomSheet>
  );
};

/* ---------------------------------- View ----------------------------------- */

export const AnnualReviewView: React.FC<AnnualReviewViewProps> = ({ cycles, onBack, onSaveDraft, onSubmit }) => {
  const openCycle = cycles.find((c) => c.status === 'Open') ?? cycles[cycles.length - 1];
  const [cycleId, setCycleId] = useState(openCycle.id);
  const [tab, setTab] = useState<'skills' | 'responsibilities'>('skills');
  const [form, setForm] = useState<AnnualReviewForm>(openCycle.form);
  const [errors, setErrors] = useState<Errors>({});
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [qualPickerOpen, setQualPickerOpen] = useState(false);
  const [datePicker, setDatePicker] = useState<{ name: string; field: 'targetDate' | 'completionDate' } | null>(null);
  const [confirm, setConfirm] = useState<'submit' | 'discard' | 'reset' | null>(null);

  const cycle = cycles.find((c) => c.id === cycleId) ?? openCycle;
  const readOnly = cycle.status === 'Submitted';
  const shownForm = readOnly ? cycle.form : form;
  const dirty = !readOnly && JSON.stringify(form) !== JSON.stringify(openCycle.form);

  const progress = useMemo(() => {
    const done = {
      technical: form.technical.some((r) => isComplete(r, true)),
      software: form.software.some((r) => isComplete(r, true)),
      communication: isComplete(form.communication, false),
      domain: form.domain.some((r) => isComplete(r, true)),
    };
    return { done, count: Object.values(done).filter(Boolean).length };
  }, [form]);

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const updateRow = (key: ListKey, id: string, patch: Partial<SkillRow>) => {
    setForm((f) => ({ ...f, [key]: f[key].map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    clearError(id);
  };
  const addRow = (key: ListKey) => setForm((f) => ({ ...f, [key]: [...f[key], newSkillRow()] }));
  const removeRow = (key: ListKey, id: string) => {
    // The last row is cleared instead of removed so the section never goes empty
    setForm((f) => ({ ...f, [key]: f[key].length > 1 ? f[key].filter((r) => r.id !== id) : [newSkillRow()] }));
    clearError(id);
  };
  const updateQual = (name: string, patch: Partial<FutureQualification>) => {
    setForm((f) => ({ ...f, futureQualifications: f.futureQualifications.map((q) => (q.name === name ? { ...q, ...patch } : q)) }));
    clearError(`qual-${name}`);
  };

  const handleBack = () => (dirty ? setConfirm('discard') : onBack());
  const handleSubmitTap = () => {
    const next = { ...validate(form), ...validateAdditional(form.additional) };
    setErrors(next);
    const keys = Object.keys(next);
    if (keys.length === 0) return setConfirm('submit');
    // Jump to the tab with problems if the current one is clean
    const inResp = keys.some(isResponsibilityError);
    const inSkills = keys.some((k) => !isResponsibilityError(k));
    if (tab === 'skills' && !inSkills && inResp) setTab('responsibilities');
    if (tab === 'responsibilities' && !inResp && inSkills) setTab('skills');
  };

  const skillErrorCount = Object.keys(errors).filter((k) => !isResponsibilityError(k)).length;
  const respErrorCount = Object.keys(errors).length - skillErrorCount;
  const errorCount = tab === 'skills' ? skillErrorCount : respErrorCount;

  const renderList = (key: ListKey, icon: React.ElementType, subtitle: string) => {
    const meta = LIST_META[key];
    const rows = shownForm[key];
    if (readOnly) {
      return (
        <SectionCard icon={icon} title={meta.title} subtitle={subtitle}>
          {rows.length ? (
            rows.map((r) => (
              <RatedRow key={r.id} title={r.item} meta={key === 'software' ? softwareCategory(r.item) : undefined} row={r} />
            ))
          ) : (
            <p className="text-[11.5px] text-slate-400">Nothing added in this cycle.</p>
          )}
        </SectionCard>
      );
    }
    return (
      <SectionCard icon={icon} title={meta.title} subtitle={subtitle} done={progress.done[key]}>
        {rows.map((r, i) => {
          const taken = new Set(rows.filter((o) => o.id !== r.id).map((o) => o.item));
          const category = key === 'software' ? softwareCategory(r.item) : '';
          return (
            <div key={r.id} className={`rounded-xl border p-3 space-y-2.5 ${errors[r.id] ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                  {meta.noun} {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(key, r.id)}
                  className="w-7 h-7 -m-1 rounded-lg flex items-center justify-center text-slate-400 active:bg-rose-50 cursor-pointer"
                  aria-label={`Remove ${meta.noun.toLowerCase()} ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div>
                <Dropdown<string>
                  value={r.item || null}
                  options={meta.options.map((o) => ({
                    value: o,
                    label: o,
                    description: key === 'software' ? softwareCategory(o) : undefined,
                    disabled: taken.has(o),
                  }))}
                  onChange={(v) => updateRow(key, r.id, { item: v })}
                  placeholder={`Select ${meta.noun.toLowerCase()}`}
                  ariaLabel={meta.noun}
                  sheetTitle={`Select ${meta.noun.toLowerCase()}`}
                />
                {category && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10.5px] font-semibold">
                    {category}
                  </span>
                )}
              </div>
              <LevelFields row={r} onChange={(patch) => updateRow(key, r.id, patch)} />
              <RemarksField value={r.remarks} onChange={(v) => updateRow(key, r.id, { remarks: v })} />
              <ErrorText message={errors[r.id]} />
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => addRow(key)}
          className="w-full h-10 rounded-xl border border-dashed border-indigo-200 text-[#4F46E5] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-indigo-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add More
        </button>
      </SectionCard>
    );
  };

  const quals = shownForm.futureQualifications;
  const pickerQual = datePicker ? form.futureQualifications.find((q) => q.name === datePicker.name) : undefined;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold ml-2 flex-1 truncate">Annual Review</h1>
          <button
            type="button"
            onClick={() => setInstructionsOpen(true)}
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[#2F68FE] text-[11.5px] font-bold active:bg-blue-50 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            Instructions
          </button>
        </div>
        <div className="px-4 pb-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <Dropdown<string>
                value={cycleId}
                options={[...cycles].reverse().map((c) => ({
                  value: c.id,
                  label: cycleLabel(c.id),
                  description: c.status === 'Open' ? 'Open · Your action' : `Submitted ${formatReviewDate(c.submittedOn ?? '')}`,
                }))}
                onChange={(id) => {
                  setCycleId(id);
                  setErrors({});
                }}
                icon={<CalendarDays className="w-4 h-4" />}
                ariaLabel="Review cycle"
              />
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="h-10 px-3 rounded-xl bg-blue-50 text-[#2F68FE] text-[11.5px] font-bold flex items-center gap-1.5 shrink-0 active:bg-blue-100 cursor-pointer"
            >
              <FileBarChart className="w-4 h-4" />
              Report
            </button>
          </div>
          <SegmentedTabs
            ariaLabel="Review sections"
            value={tab}
            onChange={setTab}
            options={[
              { id: 'skills', label: 'Personal Skill', badge: skillErrorCount || undefined },
              { id: 'responsibilities', label: 'Additional Responsibilities', badge: respErrorCount || undefined },
            ]}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {tab === 'responsibilities' ? (
          <>
            {errorCount > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11.5px] font-semibold text-rose-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorCount === 1 ? '1 item needs your attention.' : `${errorCount} items need your attention.`}
              </div>
            )}
            <AdditionalResponsibilitiesTab
              value={shownForm.additional}
              update={(fn) => setForm((f) => ({ ...f, additional: fn(f.additional) }))}
              errors={errors}
              clearError={clearError}
              readOnly={readOnly}
            />
          </>
        ) : (
          <>
            {/* Status */}
            {readOnly ? (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="w-9 h-9 rounded-xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <span className="text-xs text-emerald-800 leading-snug">
                  <strong className="font-bold">Submitted on {formatReviewDate(cycle.submittedOn ?? '')}.</strong> This review is view only.
                </span>
              </div>
            ) : (
              <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E293B]">Current and Future Skillsets</span>
                  <span className="text-[11px] font-semibold text-slate-500 tabular-nums">{progress.count} of 4 rated</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-[#2F68FE] to-[#6366F1] transition-all"
                    style={{ width: `${(progress.count / 4) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400 leading-snug">
                  Rate where you are today and where you want to be in the next 12 months.
                </p>
              </div>
            )}

            {errorCount > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11.5px] font-semibold text-rose-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorCount === 1 ? '1 item needs your attention.' : `${errorCount} items need your attention.`}
              </div>
            )}

            {renderList('technical', Wrench, 'Select & rate your technical skills')}
            {renderList('software', Laptop, 'Select & rate your software expertise')}

            {/* Communication — single rating */}
            {readOnly ? (
              <SectionCard icon={MessageSquareText} title="Communication Skills" subtitle="Rate your communication skills">
                <RatedRow row={shownForm.communication} />
              </SectionCard>
            ) : (
              <SectionCard
                icon={MessageSquareText}
                title="Communication Skills"
                subtitle="Rate your communication skills"
                done={progress.done.communication}
              >
                <div className={`rounded-xl border p-3 space-y-2.5 ${errors.communication ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}>
                  <LevelFields
                    row={form.communication}
                    onChange={(patch) => {
                      setForm((f) => ({ ...f, communication: { ...f.communication, ...patch } }));
                      clearError('communication');
                    }}
                  />
                  <RemarksField
                    value={form.communication.remarks}
                    onChange={(v) => setForm((f) => ({ ...f, communication: { ...f.communication, remarks: v } }))}
                  />
                  <ErrorText message={errors.communication} />
                </div>
              </SectionCard>
            )}

            {renderList('domain', Globe, 'Select & rate your overall domain understanding')}

            {/* Qualifications */}
            <SectionCard icon={Award} title="Current Qualifications" subtitle="From your profile">
              <div className="flex flex-wrap gap-1.5">
                {CURRENT_QUALIFICATIONS.map((q) => (
                  <span key={q} className="px-2.5 py-1 rounded-full bg-indigo-50 text-[#4F46E5] text-[11px] font-semibold">
                    {q}
                  </span>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={GraduationCap}
              title="Future Qualifications"
              subtitle="Qualifications you're working towards"
              action={
                !readOnly && (
                  <button
                    type="button"
                    onClick={() => setQualPickerOpen(true)}
                    className="h-8 px-2.5 rounded-lg bg-blue-50 text-[#2F68FE] text-[11px] font-bold flex items-center gap-1 shrink-0 active:bg-blue-100 cursor-pointer"
                  >
                    {quals.length ? 'Edit' : 'Select'}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )
              }
            >
              {quals.length === 0 ? (
                <p className="text-[11.5px] text-slate-400">
                  {readOnly ? 'No qualifications added in this cycle.' : 'No qualifications selected yet. Tap Select to add one.'}
                </p>
              ) : (
                quals.map((q) => {
                  const errKey = `qual-${q.name}`;
                  return (
                    <div
                      key={q.name}
                      className={`rounded-xl border p-3 space-y-2.5 ${errors[errKey] ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#1E293B]">{q.name}</span>
                        {readOnly && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10.5px] font-bold">{q.status}</span>
                        )}
                      </div>
                      {readOnly ? (
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <span>
                            <span className="block text-slate-400">Part</span>
                            <span className="font-semibold text-slate-700">{q.partName || '—'}</span>
                          </span>
                          <span>
                            <span className="block text-slate-400">{q.status === 'Completed' ? 'Completed on' : 'Target date'}</span>
                            <span className="font-semibold text-slate-700">
                              {q.status === 'Completed'
                                ? q.completionDate
                                  ? formatReviewDate(q.completionDate)
                                  : '—'
                                : q.targetDate
                                  ? formatReviewDate(q.targetDate)
                                  : '—'}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="min-w-0">
                              <FieldLabel>Status</FieldLabel>
                              <Dropdown
                                value={q.status}
                                options={QUALIFICATION_STATUSES}
                                onChange={(v) => updateQual(q.name, { status: v })}
                                ariaLabel="Status"
                              />
                            </div>
                            <div className="min-w-0">
                              <FieldLabel>Part Name</FieldLabel>
                              <input
                                value={q.partName}
                                onChange={(e) => updateQual(q.name, { partName: e.target.value })}
                                placeholder="e.g. Part 1"
                                maxLength={40}
                                className={inputClass}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <DateButton
                              label="Targeted Date"
                              value={q.targetDate}
                              onClick={() => setDatePicker({ name: q.name, field: 'targetDate' })}
                            />
                            <DateButton
                              label="Date of Completion"
                              value={q.completionDate}
                              disabled={q.status !== 'Completed'}
                              onClick={() => setDatePicker({ name: q.name, field: 'completionDate' })}
                            />
                          </div>
                          <ErrorText message={errors[errKey]} />
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </SectionCard>
          </>
        )}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex gap-2">
          <button
            type="button"
            onClick={() => setConfirm('reset')}
            className="flex-1 h-12 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 active:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => onSaveDraft(cycle.id, form)}
            className="flex-1 h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleSubmitTap}
            className="flex-[1.5] h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Save & Submit
          </button>
        </div>
      )}

      <InstructionsSheet isOpen={instructionsOpen} onClose={() => setInstructionsOpen(false)} />

      <MultiSelectSheet
        isOpen={qualPickerOpen}
        title="Future Qualifications"
        options={QUALIFICATIONS.map((q) => ({ value: q, label: q }))}
        selected={form.futureQualifications.map((q) => q.name)}
        searchPlaceholder="Search qualifications"
        onClose={() => setQualPickerOpen(false)}
        onApply={(names) => {
          setForm((f) => ({
            ...f,
            // Keep details already entered for qualifications that stay selected
            futureQualifications: names.map(
              (name) =>
                f.futureQualifications.find((q) => q.name === name) ?? {
                  name,
                  status: 'Enrolled',
                  partName: '',
                  targetDate: '',
                  completionDate: '',
                }
            ),
          }));
          setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith('qual-') || names.includes(k.slice(5)))));
          setQualPickerOpen(false);
        }}
      />

      <DatePickerSheet
        isOpen={Boolean(datePicker)}
        mode="single"
        title={datePicker?.field === 'completionDate' ? 'Date of Completion' : 'Targeted Date of Completion'}
        start={pickerQual && datePicker ? pickerQual[datePicker.field] || null : null}
        minDate={datePicker?.field === 'targetDate' ? todayIso() : undefined}
        onClose={() => setDatePicker(null)}
        onApply={(iso) => {
          if (datePicker) updateQual(datePicker.name, { [datePicker.field]: iso });
          setDatePicker(null);
        }}
      />

      <ConfirmSheet
        isOpen={confirm === 'submit'}
        title="Submit your annual review?"
        body={`Once submitted, your ${cycleLabel(cycle.id)} review can't be edited.`}
        onClose={() => setConfirm(null)}
        actions={[
          {
            label: 'Submit Review',
            tone: 'primary',
            onClick: () => {
              setConfirm(null);
              onSubmit(cycle.id, clean(form));
            },
          },
          { label: 'Keep Editing', tone: 'secondary', onClick: () => setConfirm(null) },
        ]}
      />

      <ConfirmSheet
        isOpen={confirm === 'reset'}
        title="Reset the form?"
        body="This clears all your answers on both Personal Skill and Additional Responsibilities."
        onClose={() => setConfirm(null)}
        actions={[
          {
            label: 'Reset Form',
            tone: 'danger',
            onClick: () => {
              setConfirm(null);
              setForm(emptyReviewForm());
              setErrors({});
            },
          },
          { label: 'Keep My Answers', tone: 'secondary', onClick: () => setConfirm(null) },
        ]}
      />

      <ConfirmSheet
        isOpen={confirm === 'discard'}
        title="Leave without saving?"
        body="You have changes that aren't saved yet."
        onClose={() => setConfirm(null)}
        actions={[
          {
            label: 'Save & Leave',
            tone: 'primary',
            onClick: () => {
              setConfirm(null);
              onSaveDraft(cycle.id, form);
              onBack();
            },
          },
          {
            label: 'Discard Changes',
            tone: 'danger',
            onClick: () => {
              setConfirm(null);
              onBack();
            },
          },
          { label: 'Keep Editing', tone: 'secondary', onClick: () => setConfirm(null) },
        ]}
      />
    </div>
  );
};
