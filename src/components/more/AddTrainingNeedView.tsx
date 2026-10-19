import React, { useState } from 'react';
import { ArrowLeft, Wand2, UserRound, GraduationCap, Gauge, Flag, CalendarClock, StickyNote, Lock, Info, ChevronDown } from 'lucide-react';
import { Dropdown } from '../../design-system/components/Dropdown';
import { ChoiceTiles } from '../common/ChoiceTiles';
import { DateWheelSheet, todayIso } from '../common/DateWheelSheet';
import { FormSection } from './WfhRequestFields';
import { LevelMeter, PRIORITY_META } from './TrainingNeedView';
import { MAIN_PROGRAMMES, TRAINING_PROGRAMMES, TrainingPerson } from '../../data/trainingRequestData';
import { NEED_PRIORITIES, NeedPriority, SKILL_LEVELS, TrainingNeed, levelLabel } from '../../data/trainingNeedData';

export type TrainingNeedDraft = Pick<
  TrainingNeed,
  'staffCode' | 'mainProgramme' | 'skill' | 'currentLevel' | 'requiredLevel' | 'priority' | 'targetDate' | 'remarks'
>;

interface AddTrainingNeedViewProps {
  /** The signed-in user */
  me: TrainingPerson;
  /** Manager login: people they can identify a need for (themselves first). Staff: omitted, locked to self */
  people?: TrainingPerson[];
  /** Prefilled staff when opened from the Team tab ('' = pick one) */
  defaultStaffCode?: string;
  /** Editing an existing need */
  initial?: TrainingNeed;
  onBack: () => void;
  onSubmit: (draft: TrainingNeedDraft) => void;
}

const MAX_REMARKS = 500;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

const addMonths = (iso: string, months: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Priority suggested by how many levels apart the two ratings are */
const suggestPriority = (gap: number): NeedPriority => (gap >= 3 ? 'High' : gap === 2 ? 'Medium' : 'Low');

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600">
    {children}
    {required && <span className="text-rose-500"> *</span>}
  </label>
);

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="px-0.5 text-[11px] font-medium text-rose-500">{message}</p> : null;

/** Five numbered tiles (1 Beginner … 5 Expert) with the picked level explained underneath */
const LevelPicker: React.FC<{ ariaLabel: string; value: number | null; error?: boolean; onChange: (level: number) => void }> = ({
  ariaLabel,
  value,
  error,
  onChange,
}) => {
  const picked = SKILL_LEVELS.find((l) => l.level === value);
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={ariaLabel}>
        {SKILL_LEVELS.map(({ level, label }) => {
          const on = value === level;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(level)}
              className={`h-14 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                on
                  ? 'border-[#2F68FE] bg-blue-50/70 text-[#2F68FE]'
                  : `bg-white text-slate-600 active:bg-slate-50 ${error ? 'border-rose-300' : 'border-slate-200'}`
              }`}
            >
              <span className="text-sm font-bold leading-none tabular-nums">{level}</span>
              <span className={`text-[9.5px] leading-none ${on ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </button>
          );
        })}
      </div>
      <p className="px-0.5 text-[11px] text-slate-400 min-h-4">{picked ? picked.hint : error ? '' : 'Select a level'}</p>
    </div>
  );
};

export const AddTrainingNeedView: React.FC<AddTrainingNeedViewProps> = ({ me, people, defaultStaffCode, initial, onBack, onSubmit }) => {
  const canPickStaff = Boolean(people?.length) && !initial;
  const [staffCode, setStaffCode] = useState(initial?.staffCode ?? defaultStaffCode ?? me.staffCode);
  const [mainProgramme, setMainProgramme] = useState<string | null>(initial?.mainProgramme ?? null);
  const [skill, setSkill] = useState<string | null>(initial?.skill ?? null);
  const [currentLevel, setCurrentLevel] = useState<number | null>(initial?.currentLevel ?? null);
  const [requiredLevel, setRequiredLevel] = useState<number | null>(initial?.requiredLevel ?? null);
  const [priority, setPriority] = useState<NeedPriority>(initial?.priority ?? 'Medium');
  const [priorityTouched, setPriorityTouched] = useState(Boolean(initial));
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? '');
  const [remarks, setRemarks] = useState(initial?.remarks ?? '');
  const [datePicker, setDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (...keys: string[]) => setErrors((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, keys.includes(k) ? '' : v])));
  const staff = [me, ...(people ?? [])].find((p) => p.staffCode === staffCode);
  const forSomeoneElse = staff && staff.staffCode !== me.staffCode;
  const gap = currentLevel && requiredLevel ? requiredLevel - currentLevel : 0;

  // Until the priority is picked by hand, keep it in step with the size of the gap
  const rate = (current: number | null, required: number | null) => {
    if (!priorityTouched && current && required && required > current) setPriority(suggestPriority(required - current));
  };

  const quickFill = () => {
    const main = MAIN_PROGRAMMES[1];
    if (canPickStaff && !staffCode) setStaffCode(me.staffCode);
    setMainProgramme(main);
    setSkill(TRAINING_PROGRAMMES[main][0]);
    setCurrentLevel(2);
    setRequiredLevel(4);
    setPriority('Medium');
    setPriorityTouched(false);
    setTargetDate(addMonths(todayIso(), 2));
    setRemarks('Handling more of these returns this season and my review notes show I still need guidance on the basics.');
    setErrors({});
  };

  const submit = () => {
    const found: Record<string, string> = {};
    if (!staffCode) found.staff = 'Choose who this need is for.';
    if (!mainProgramme) found.main = 'Select a main programme.';
    if (!skill) found.skill = 'Select the skill that needs work.';
    if (!currentLevel) found.current = 'Rate the current level.';
    if (!requiredLevel) found.required = 'Rate the level required.';
    else if (currentLevel && requiredLevel <= currentLevel) found.required = 'The required level must be higher than the current level.';
    if (!targetDate) found.date = 'Select a target date.';
    if (!remarks.trim()) found.remarks = 'Add a short note explaining the gap.';
    setErrors(found);
    if (Object.values(found).some(Boolean) || !mainProgramme || !skill || !currentLevel || !requiredLevel) return;
    setSubmitting(true);
    setTimeout(
      () => onSubmit({ staffCode, mainProgramme, skill, currentLevel, requiredLevel, priority, targetDate, remarks: remarks.trim() }),
      500
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center justify-between h-14 px-4 relative">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold screen-title screen-title-tight">{initial ? 'Edit Training Need' : 'Identify Training Need'}</h1>
          {!initial && (
            <button
              type="button"
              onClick={quickFill}
              className="h-8 px-2.5 rounded-full bg-indigo-50 text-[#4F46E5] text-[11px] font-semibold flex items-center gap-1 active:bg-indigo-100 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Quick Fill
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3.5">
        <p className="px-1 text-[11.5px] text-slate-500">
          {canPickStaff ? 'Record a skill gap for yourself or a team member.' : 'Note a skill you want to build. Rate where you are and where you need to be.'}
        </p>

        {/* Staff */}
        <FormSection icon={<UserRound className="w-4 h-4" />} title="Staff">
          <div className="space-y-1">
            <Label required={canPickStaff}>Staff Name</Label>
            {canPickStaff ? (
              <Dropdown
                ariaLabel="Staff name"
                sheetTitle="Select Staff"
                value={staffCode || null}
                placeholder="Select Staff"
                options={[me, ...people!].map((p) => ({
                  value: p.staffCode,
                  label: p.staffCode === me.staffCode ? `${p.staffName} (You)` : p.staffName,
                }))}
                onChange={(v) => {
                  setStaffCode(v);
                  clearError('staff');
                }}
              />
            ) : (
              <div className="h-12 px-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-600">
                {staff?.staffName ?? me.staffName}
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            )}
            <FieldError message={errors.staff} />
          </div>
          {staff && (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-500">{staff.staffCode}</span>· Reports to {staff.reportingManager}
            </p>
          )}
        </FormSection>

        {/* Skill */}
        <FormSection icon={<GraduationCap className="w-4 h-4" />} title="Skill">
          <div className="space-y-1">
            <Label required>Main Programme</Label>
            <Dropdown
              ariaLabel="Main programme"
              sheetTitle="Main Programme"
              value={mainProgramme}
              placeholder="Select Main"
              options={MAIN_PROGRAMMES}
              onChange={(v) => {
                if (v !== mainProgramme) setSkill(null);
                setMainProgramme(v);
                clearError('main');
              }}
            />
            <FieldError message={errors.main} />
          </div>
          <div className="space-y-1">
            <Label required>Skill</Label>
            {mainProgramme ? (
              <Dropdown
                ariaLabel="Skill"
                sheetTitle="Skill"
                value={skill}
                placeholder="Select Skill"
                options={TRAINING_PROGRAMMES[mainProgramme]}
                onChange={(v) => {
                  setSkill(v);
                  clearError('skill');
                }}
              />
            ) : (
              <div className="h-12 px-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-medium text-slate-400">
                Pick a main programme first
                <ChevronDown className="w-4 h-4" />
              </div>
            )}
            <FieldError message={errors.skill} />
          </div>
        </FormSection>

        {/* Proficiency */}
        <FormSection icon={<Gauge className="w-4 h-4" />} title="Proficiency">
          <div className="space-y-1.5">
            <Label required>Current Level</Label>
            <LevelPicker
              ariaLabel="Current level"
              value={currentLevel}
              error={Boolean(errors.current)}
              onChange={(l) => {
                setCurrentLevel(l);
                rate(l, requiredLevel);
                clearError('current', 'required');
              }}
            />
            <FieldError message={errors.current} />
          </div>
          <div className="space-y-1.5">
            <Label required>Required Level</Label>
            <LevelPicker
              ariaLabel="Required level"
              value={requiredLevel}
              error={Boolean(errors.required)}
              onChange={(l) => {
                setRequiredLevel(l);
                rate(currentLevel, l);
                clearError('required');
              }}
            />
            <FieldError message={errors.required} />
          </div>
          {gap > 0 && currentLevel && requiredLevel && (
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EBF0F7] space-y-2">
              <LevelMeter current={currentLevel} required={requiredLevel} priority={priority} large />
              <p className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {levelLabel(currentLevel)} → {levelLabel(requiredLevel)}
                </span>
                <span className={`font-bold ${PRIORITY_META[priority].text}`}>
                  {gap} level{gap === 1 ? '' : 's'} to close
                </span>
              </p>
            </div>
          )}
        </FormSection>

        {/* Priority */}
        <FormSection icon={<Flag className="w-4 h-4" />} title="Priority">
          <ChoiceTiles
            options={NEED_PRIORITIES}
            selected={[priority]}
            multiple={false}
            onChange={([p]) => {
              setPriority(p as NeedPriority);
              setPriorityTouched(true);
            }}
          />
          <p className="text-[11px] text-slate-400">Suggested from the size of the gap. Change it if this needs sooner attention.</p>
        </FormSection>

        {/* Target date */}
        <FormSection icon={<CalendarClock className="w-4 h-4" />} title="Target Date">
          <button
            type="button"
            onClick={() => setDatePicker(true)}
            className={`w-full h-12 px-3.5 rounded-xl border bg-white flex items-center gap-2.5 text-left text-xs font-semibold text-[#1E293B] cursor-pointer active:bg-slate-50 ${
              errors.date ? 'border-rose-300' : 'border-slate-200'
            }`}
          >
            <CalendarClock className="w-4 h-4 text-slate-400" />
            {targetDate ? formatDate(targetDate) : <span className="font-medium text-slate-400">Select date</span>}
          </button>
          <FieldError message={errors.date} />
        </FormSection>

        {/* Remarks */}
        <FormSection icon={<StickyNote className="w-4 h-4" />} title="Remarks" right={<span className="text-[10px] font-semibold text-rose-500">Required</span>}>
          <div className="relative">
            <textarea
              rows={3}
              value={remarks}
              maxLength={MAX_REMARKS}
              onChange={(e) => {
                setRemarks(e.target.value);
                clearError('remarks');
              }}
              placeholder="What is the gap and where did you notice it?"
              className={`w-full p-3.5 pb-7 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text ${
                errors.remarks ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 pointer-events-none tabular-nums">
              {remarks.length}/{MAX_REMARKS}
            </span>
          </div>
          <FieldError message={errors.remarks} />
        </FormSection>

        <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          {forSomeoneElse
            ? `${staff!.staffName.split(' ')[0]} will be notified. You can send a training request for this need once it is saved.`
            : 'Your manager can see this need. Once it is saved you can request training for it in one tap.'}
        </p>
      </div>

      <div className="shrink-0 p-4 pb-5 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {submitting ? 'Saving…' : initial ? 'Save Changes' : 'Save Training Need'}
        </button>
      </div>

      <DateWheelSheet
        isOpen={datePicker}
        title="Target Date"
        value={targetDate || todayIso()}
        min={initial && initial.targetDate < todayIso() ? initial.targetDate : todayIso()}
        max={addMonths(todayIso(), 12)}
        onClose={() => setDatePicker(false)}
        onApply={(iso) => {
          setTargetDate(iso);
          clearError('date');
          setDatePicker(false);
        }}
      />
    </div>
  );
};
