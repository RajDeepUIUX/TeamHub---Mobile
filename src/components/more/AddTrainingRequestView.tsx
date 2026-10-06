import React, { useState } from 'react';
import { ArrowLeft, Wand2, UserRound, GraduationCap, Layers, Monitor, CalendarDays, StickyNote, ChevronRight, X, Lock, Info } from 'lucide-react';
import { Dropdown } from '../../design-system/components/Dropdown';
import { MultiSelectSheet } from '../common/MultiSelectSheet';
import { DateWheelSheet, todayIso } from '../common/DateWheelSheet';
import { FormSection } from './WfhRequestFields';
import { MAIN_PROGRAMMES, TRAINING_PROGRAMMES, TRAINING_SOFTWARE, TrainingPerson, TrainingRequest } from '../../data/trainingRequestData';

export type TrainingRequestDraft = Pick<TrainingRequest, 'staffCode' | 'mainProgramme' | 'subProgrammes' | 'software' | 'requestedOn' | 'remarks'>;

interface AddTrainingRequestViewProps {
  /** The signed-in user */
  me: TrainingPerson;
  /** Manager login: people they can raise a request for (themselves first). Staff: omitted, locked to self */
  people?: TrainingPerson[];
  /** Prefilled staff when opened from the Team tab ('' = pick one) */
  defaultStaffCode?: string;
  /** Editing an existing request */
  initial?: TrainingRequest;
  onBack: () => void;
  onSubmit: (draft: TrainingRequestDraft) => void;
}

const MAX_REMARKS = 500;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

const addMonths = (iso: string, months: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const Label: React.FC<{ children: React.ReactNode; required?: boolean; optional?: boolean }> = ({ children, required, optional }) => (
  <label className="block text-[11px] font-semibold text-slate-600">
    {children}
    {required && <span className="text-rose-500"> *</span>}
    {optional && <span className="ml-1 text-[10px] font-medium text-[#2F68FE]">(Optional)</span>}
  </label>
);

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="px-0.5 text-[11px] font-medium text-rose-500">{message}</p> : null;

/** Field that opens a multi-select sheet; picked values show as removable chips below */
const ChipPicker: React.FC<{
  values: string[];
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
  onOpen: () => void;
  onRemove: (v: string) => void;
}> = ({ values, placeholder, disabled, error, onOpen, onRemove }) => (
  <div className="space-y-2">
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className={`w-full h-12 px-3.5 rounded-xl border bg-white flex items-center justify-between gap-2 text-left text-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-50 ${
        error ? 'border-rose-300' : 'border-slate-200'
      }`}
    >
      <span className={`truncate ${values.length ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'}`}>
        {values.length ? `${values.length} selected` : placeholder}
      </span>
      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
    </button>
    {values.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-blue-50 text-[11px] font-semibold text-[#2F68FE]">
            {v}
            <button
              type="button"
              onClick={() => onRemove(v)}
              className="w-4.5 h-4.5 rounded-md flex items-center justify-center active:bg-blue-100 cursor-pointer"
              aria-label={`Remove ${v}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    )}
  </div>
);

export const AddTrainingRequestView: React.FC<AddTrainingRequestViewProps> = ({ me, people, defaultStaffCode, initial, onBack, onSubmit }) => {
  const canPickStaff = Boolean(people?.length) && !initial;
  const [staffCode, setStaffCode] = useState(initial?.staffCode ?? defaultStaffCode ?? me.staffCode);
  const [mainProgramme, setMainProgramme] = useState<string | null>(initial?.mainProgramme ?? null);
  const [subProgrammes, setSubProgrammes] = useState<string[]>(initial?.subProgrammes ?? []);
  const [software, setSoftware] = useState<string[]>(initial?.software ?? []);
  const [requestedOn, setRequestedOn] = useState(initial?.requestedOn ?? todayIso());
  const [remarks, setRemarks] = useState(initial?.remarks ?? '');
  const [picker, setPicker] = useState<null | 'sub' | 'software' | 'date'>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (key: string) => setErrors((p) => ({ ...p, [key]: '' }));
  const staff = [me, ...(people ?? [])].find((p) => p.staffCode === staffCode);
  const forSomeoneElse = staff && staff.staffCode !== me.staffCode;

  const quickFill = () => {
    const main = MAIN_PROGRAMMES[0];
    if (canPickStaff && !staffCode) setStaffCode(me.staffCode);
    setMainProgramme(main);
    setSubProgrammes(TRAINING_PROGRAMMES[main].slice(0, 2));
    setSoftware(['Lacerte']);
    setRemarks('Handling more individual returns this season and want a refresher on 1099 income.');
    setErrors({});
  };

  const submit = () => {
    const found: Record<string, string> = {};
    if (!staffCode) found.staff = 'Choose who the training is for.';
    if (!mainProgramme) found.main = 'Select a main programme.';
    if (!subProgrammes.length) found.sub = 'Pick at least one sub programme.';
    if (!requestedOn) found.date = 'Select the date of request.';
    if (!remarks.trim()) found.remarks = 'Add a short note for the L&D team.';
    setErrors(found);
    if (Object.values(found).some(Boolean) || !mainProgramme) return;
    setSubmitting(true);
    setTimeout(() => onSubmit({ staffCode, mainProgramme, subProgrammes, software, requestedOn, remarks: remarks.trim() }), 500);
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
          <h1 className="text-base font-bold screen-title screen-title-tight">{initial ? 'Edit Training Request' : 'New Training Request'}</h1>
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
          {canPickStaff ? 'Raise a training request for yourself or a team member.' : 'Fill in the details to request training for yourself.'}
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

        {/* Programme */}
        <FormSection icon={<GraduationCap className="w-4 h-4" />} title="Programme">
          <div className="space-y-1">
            <Label required>Main Programme</Label>
            <Dropdown
              ariaLabel="Main programme"
              sheetTitle="Main Programme"
              value={mainProgramme}
              placeholder="Select Main"
              options={MAIN_PROGRAMMES}
              onChange={(v) => {
                if (v !== mainProgramme) setSubProgrammes([]);
                setMainProgramme(v);
                clearError('main');
              }}
            />
            <FieldError message={errors.main} />
          </div>
          <div className="space-y-1">
            <Label required>Sub Programme</Label>
            <ChipPicker
              values={subProgrammes}
              placeholder={mainProgramme ? 'Nothing selected' : 'Pick a main programme first'}
              disabled={!mainProgramme}
              error={Boolean(errors.sub)}
              onOpen={() => setPicker('sub')}
              onRemove={(v) => setSubProgrammes((s) => s.filter((x) => x !== v))}
            />
            <FieldError message={errors.sub} />
          </div>
        </FormSection>

        {/* Software */}
        <FormSection icon={<Monitor className="w-4 h-4" />} title="Software" right={<span className="text-[10px] text-slate-400">Optional</span>}>
          <ChipPicker
            values={software}
            placeholder="Select"
            onOpen={() => setPicker('software')}
            onRemove={(v) => setSoftware((s) => s.filter((x) => x !== v))}
          />
        </FormSection>

        {/* Date */}
        <FormSection icon={<CalendarDays className="w-4 h-4" />} title="Date of Request">
          <button
            type="button"
            onClick={() => setPicker('date')}
            className={`w-full h-12 px-3.5 rounded-xl border bg-white flex items-center gap-2.5 text-left text-xs font-semibold text-[#1E293B] cursor-pointer active:bg-slate-50 ${
              errors.date ? 'border-rose-300' : 'border-slate-200'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-slate-400" />
            {requestedOn ? formatDate(requestedOn) : <span className="font-medium text-slate-400">Select date</span>}
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
              placeholder="Additional note for the training request"
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
            ? `${staff!.staffName.split(' ')[0]} will be notified. The L&D team schedules the training and updates its status.`
            : 'The L&D team schedules the training and updates its status. You can edit or withdraw it until they pick it up.'}
        </p>
      </div>

      <div className="shrink-0 p-4 pb-5 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {submitting ? 'Saving…' : initial ? 'Save Changes' : 'Submit Request'}
        </button>
      </div>

      <MultiSelectSheet
        isOpen={picker === 'sub'}
        title="Sub Programme"
        searchPlaceholder="Search sub programmes…"
        showSelectAll
        options={(mainProgramme ? TRAINING_PROGRAMMES[mainProgramme] : []).map((s) => ({ value: s, label: s }))}
        selected={subProgrammes}
        onClose={() => setPicker(null)}
        onApply={(v) => {
          setSubProgrammes(v);
          clearError('sub');
          setPicker(null);
        }}
      />
      <MultiSelectSheet
        isOpen={picker === 'software'}
        title="Software"
        searchPlaceholder="Search software…"
        showSelectAll
        options={TRAINING_SOFTWARE.map((s) => ({ value: s, label: s }))}
        selected={software}
        onClose={() => setPicker(null)}
        onApply={(v) => {
          setSoftware(v);
          setPicker(null);
        }}
      />
      <DateWheelSheet
        isOpen={picker === 'date'}
        title="Date of Request"
        value={requestedOn}
        min={initial ? initial.requestedOn : todayIso()}
        max={addMonths(todayIso(), 6)}
        onClose={() => setPicker(null)}
        onApply={(iso) => {
          setRequestedOn(iso);
          clearError('date');
          setPicker(null);
        }}
      />
    </div>
  );
};
