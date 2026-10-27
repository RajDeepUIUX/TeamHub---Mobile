import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, GraduationCap, Info, Loader2, MessageSquareText, MonitorCog, Plus, UserRound, X } from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { ConfirmSheet, InfoSheet, fieldInputClass } from '../staff/tabs/StaffTabParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import {
  EMPTY_TNI_DRAFT,
  TNI_MAIN_PROGRAMMES,
  TNI_MAX_MESSAGE,
  TNI_PROGRAMMES,
  TNI_SOFTWARE,
  TniDraft,
  TniDraftErrors,
  validateTniDraft,
} from '../data/clientTrainingNeedData';

interface Props {
  staff: ClientStaffMember[];
  onBack: () => void;
  onSubmit: (draft: TniDraft) => void;
}

const SAVE_MS = 700;

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p className="px-0.5 text-[11px] font-medium text-rose-500" role="alert">
      {message}
    </p>
  ) : null;

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="block text-xs font-bold text-[#1E293B]">{children}</span>;

/** Staff form section (`more/WfhRequestFields` FormSection): icon tile + caps title over the fields */
const SectionCard: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <section className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 shadow-2xs space-y-3">
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#1E293B]">{title}</h2>
    </div>
    {children}
  </section>
);

/** Add TNI Request (desktop modal): staff, programmes, free-text topics, software, message; one request per staff */
export const TrainingNeedFormView: React.FC<Props> = ({ staff, onBack, onSubmit }) => {
  const [draft, setDraft] = useState<TniDraft>(EMPTY_TNI_DRAFT);
  const [topic, setTopic] = useState('');
  const [errors, setErrors] = useState<TniDraftErrors>({});
  const [infoOpen, setInfoOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const dirty = JSON.stringify(draft) !== JSON.stringify(EMPTY_TNI_DRAFT) || topic.trim() !== '';
  const subOptions = draft.mainProgramme ? TNI_PROGRAMMES[draft.mainProgramme] : [];

  const set = <K extends keyof TniDraft>(key: K, value: TniDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (key in e ? { ...e, [key]: undefined } : e));
  };

  // Any one of topic / main programme / software satisfies the "at least one" rule, so clear all three together
  const clearTrainingErrors = () => setErrors((e) => ({ ...e, trainingNames: undefined, mainProgramme: undefined, software: undefined }));

  const addTopic = (raw = topic) => {
    const v = raw.trim();
    if (!v) return draft.trainingNames;
    const next = draft.trainingNames.some((t) => t.toLowerCase() === v.toLowerCase()) ? draft.trainingNames : [...draft.trainingNames, v];
    setDraft((d) => ({ ...d, trainingNames: next }));
    setTopic('');
    clearTrainingErrors();
    return next;
  };

  const back = () => (dirty && !saving ? setDiscardOpen(true) : onBack());

  const submit = () => {
    // A topic typed but not added yet still counts (desktop select2 tags)
    const trainingNames = topic.trim() ? addTopic() : draft.trainingNames;
    const final = { ...draft, trainingNames, message: draft.message.trim() };
    const found = validateTniDraft(final);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => bodyRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return;
    }
    setSaving(true);
    timer.current = setTimeout(() => onSubmit(final), SAVE_MS);
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        <button type="button" onClick={back} aria-label="Back to Training Need Identification" className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold screen-title">Add TNI Request</h1>
      </header>

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-3.5">
        <SectionCard icon={UserRound} title="Staff">
          <div className="space-y-1.5">
            <MultiSelectDropdown
              label="Select Staff"
              placeholder="Select Staff"
              options={staff.map((s) => ({ value: s.id, label: s.name }))}
              selected={draft.staffIds}
              onChange={(next) => set('staffIds', next)}
              searchable
            />
            <FieldError message={errors.staffIds} />
            {draft.staffIds.length > 1 && <p className="px-0.5 text-[11px] text-slate-400">One request is created for each staff member.</p>}
          </div>
        </SectionCard>

        <SectionCard icon={GraduationCap} title="Request Training Programme">
          <div className="space-y-1.5">
            <Label>Main Training Programme</Label>
            <Dropdown
              ariaLabel="Main Training Programme"
              sheetTitle="Main Training Programme"
              value={draft.mainProgramme || null}
              placeholder="Select Main Training Programme"
              options={TNI_MAIN_PROGRAMMES}
              onChange={(v) => {
                if (v !== draft.mainProgramme) set('subProgrammes', []);
                set('mainProgramme', v);
                clearTrainingErrors();
              }}
            />
            <FieldError message={errors.mainProgramme} />
          </div>

          <div className="space-y-1.5">
            <MultiSelectDropdown
              label="Sub Training Programme"
              placeholder="Select Sub Training Programme"
              options={subOptions.map((s) => ({ value: s, label: s }))}
              selected={draft.subProgrammes}
              onChange={(next) => set('subProgrammes', next)}
              disabled={!draft.mainProgramme}
              disabledHint="Select a main training programme first"
            />
            <FieldError message={errors.subProgrammes} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label>Training Name (Topic)</Label>
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                aria-label="About Training Name"
                aria-haspopup="dialog"
                className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <InfoSheet isOpen={infoOpen} title="Training Name (Topic)" onClose={() => setInfoOpen(false)}>
              Please enter the topics here if you were not able to find the required topic from the main training program dropdown options.
            </InfoSheet>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTopic();
                  }
                }}
                placeholder="Enter Training Name"
                aria-label="Training Name (Topic)"
                aria-invalid={Boolean(errors.trainingNames)}
                className={`${fieldInputClass(errors.trainingNames)} flex-1 min-w-0`}
              />
              <button
                type="button"
                onClick={() => addTopic()}
                disabled={!topic.trim()}
                aria-label="Add topic"
                className="w-11 h-11 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center active:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <FieldError message={errors.trainingNames} />
            {draft.trainingNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {draft.trainingNames.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-blue-50 text-[11px] font-semibold text-[#2F68FE]">
                    {t}
                    <button
                      type="button"
                      onClick={() => set('trainingNames', draft.trainingNames.filter((x) => x !== t))}
                      className="w-4.5 h-4.5 rounded-md flex items-center justify-center active:bg-blue-100 cursor-pointer"
                      aria-label={`Remove ${t}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard icon={MonitorCog} title="Request Software Training">
          <div className="space-y-1.5">
            <MultiSelectDropdown
              label="Select Software"
              placeholder="Select Software"
              options={TNI_SOFTWARE.map((s) => ({ value: s, label: s }))}
              selected={draft.software}
              onChange={(next) => {
                set('software', next);
                clearTrainingErrors();
              }}
              searchable
            />
            <FieldError message={errors.software} />
          </div>
        </SectionCard>

        <SectionCard icon={MessageSquareText} title="Message">
          <label htmlFor="tni-message" className="sr-only">
            Message
          </label>
          <div className="relative">
            <textarea
              id="tni-message"
              rows={4}
              value={draft.message}
              maxLength={TNI_MAX_MESSAGE}
              onChange={(e) => set('message', e.target.value)}
              placeholder="Please explain briefly why your are requesting this training."
              className="w-full p-3.5 pb-7 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text"
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 pointer-events-none tabular-nums">
              {draft.message.length}/{TNI_MAX_MESSAGE}
            </span>
          </div>
        </SectionCard>
      </div>

      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 pb-5 grid grid-cols-2 gap-3 z-20">
        <button
          type="button"
          onClick={back}
          disabled={saving}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 disabled:opacity-60 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-wait cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Submitting…' : 'Submit'}
        </button>
      </div>

      <ConfirmSheet
        isOpen={discardOpen}
        title="Discard Request?"
        message="The TNI request you started will not be saved."
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
