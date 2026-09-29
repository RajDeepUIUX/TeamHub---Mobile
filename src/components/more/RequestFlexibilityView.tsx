import React, { useState } from 'react';
import {
  ArrowLeft,
  Home,
  Building2,
  Shuffle,
  Sunrise,
  PartyPopper,
  Infinity as InfinityIcon,
  CalendarRange,
  Calendar,
  Check,
  ChevronRight,
  Wand2,
  Info,
  Clock,
} from 'lucide-react';
import { FlexDuration, FlexRequest, FlexType } from '../../types/workTiming';
import {
  CURRENT_SHIFT,
  FLEX_TYPES,
  flexMeta,
  formatFlexDate,
  TIME_SLOTS,
  slotMinutes,
  formatSpan,
} from '../../data/workTimingData';
import { Dropdown } from '../../design-system/components/Dropdown';
import {
  WfhRequestFields,
  WfhFormState,
  emptyWfhForm,
  validateWfhForm,
  assetTotal,
  FormSection,
} from './WfhRequestFields';
import {
  HybridScheduleFields,
  HybridFormState,
  emptyHybridForm,
  validateHybridForm,
  toHybridSchedule,
} from './HybridScheduleFields';
import { DatePickerSheet } from '../common/DatePickerSheet';
import { toDateKey } from '../../design-system/components/RangeCalendar';

/** What the form produces; identity, status and review fields are added by the caller */
export type NewFlexRequest = Omit<
  FlexRequest,
  'id' | 'staffName' | 'staffCode' | 'status' | 'submittedAt' | 'updatedAt' | 'managerComment' | 'reviewedBy' | 'reviewedAt'
>;

interface RequestFlexibilityViewProps {
  /** Name used for the acknowledgement signature */
  signerName: string;
  /** When set, the form opens on the Details step pre-filled to edit this pending request */
  initialRequest?: FlexRequest | null;
  onExit: () => void;
  onSubmit: (request: NewFlexRequest) => void;
}

export const FLEX_ICONS: Record<FlexType, React.ElementType> = {
  'Work From Home': Home,
  'Work From Office': Building2,
  Hybrid: Shuffle,
  'Early Shift': Sunrise,
  'Early Friday': PartyPopper,
};

type Step = 'type' | 'duration' | 'details';

/** Large tappable radio card used for the first two questions */
const ChoiceCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tint: string;
  title: string;
  description: string;
}> = ({ selected, onClick, icon, tint, title, description }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
      selected ? 'border-[#2F68FE] bg-blue-50/50 ring-4 ring-blue-50' : 'border-slate-200 bg-white'
    }`}
  >
    <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] font-bold text-[#1E293B]">{title}</span>
      <span className="block text-[11px] text-slate-500 leading-snug">{description}</span>
    </span>
    <span
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
        selected ? 'border-[#2F68FE] bg-[#2F68FE] text-white' : 'border-slate-300'
      }`}
    >
      {selected && <Check className="w-3 h-3 stroke-[3]" />}
    </span>
  </button>
);

const DateButton: React.FC<{ label: string; value: string | null; onClick: () => void; invalid?: boolean }> = ({
  label,
  value,
  onClick,
  invalid,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full h-12 px-3 rounded-xl border bg-white flex items-center gap-2 text-left shadow-2xs cursor-pointer ${
      invalid ? 'border-rose-300' : 'border-slate-200'
    }`}
  >
    <Calendar className="w-4 h-4 text-[#2F68FE] shrink-0" />
    <span className="min-w-0">
      <span className="block text-[10px] font-semibold text-slate-400">{label}</span>
      <span className={`block text-xs truncate ${value ? 'font-bold text-[#1E293B]' : 'font-medium text-slate-400'}`}>
        {value ? formatFlexDate(value) : 'Select date'}
      </span>
    </span>
  </button>
);

export const RequestFlexibilityView: React.FC<RequestFlexibilityViewProps> = ({
  signerName,
  initialRequest = null,
  onExit,
  onSubmit,
}) => {
  const init = initialRequest;
  const isEditMode = Boolean(init);
  const today = toDateKey(new Date());

  const [step, setStep] = useState<Step>(init ? 'details' : 'type');
  const [type, setType] = useState<FlexType | null>(init?.type ?? null);
  const [duration, setDuration] = useState<FlexDuration | null>(init?.duration ?? null);
  const [startDate, setStartDate] = useState<string | null>(init?.startDate ?? null);
  const [endDate, setEndDate] = useState<string | null>(init?.endDate ?? null);
  const [hybridForm, setHybridForm] = useState<HybridFormState>(() =>
    init?.hybrid ? { ...init.hybrid, days: init.hybrid.days ?? [] } : emptyHybridForm()
  );
  const [startTime, setStartTime] = useState<string | null>(init?.startTime ?? null);
  const [endTime, setEndTime] = useState<string | null>(init?.endTime ?? null);
  const [wfhForm, setWfhForm] = useState<WfhFormState>(() =>
    init?.wfh
      ? {
          reason: init.wfh.reason,
          // Previously uploaded files are shown by name (no local preview)
          attachments: init.wfh.attachments.map((name) => ({ name, url: '' })),
          assets: { ...init.wfh.assets },
          address: init.wfh.deliveryAddress ? { ...init.wfh.deliveryAddress } : emptyWfhForm().address,
          accepted: Boolean(init.wfh.acknowledgedBy),
        }
      : emptyWfhForm()
  );
  const [reason, setReason] = useState(init?.reason ?? '');
  const [datePicker, setDatePicker] = useState<'single' | 'range' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const asksDuration = type ? flexMeta(type).asksDuration : true;
  // Work From Office only asks for office hours (no dates); every other type is Permanent or Temporary
  const isWFO = type === 'Work From Office';
  const isWFH = type === 'Work From Home';
  const isHybrid = type === 'Hybrid';
  const isPeriod = duration === 'Temporary';
  // WFH and Hybrid share the request details / assets / delivery / acknowledgement sections
  const isEarlyShift = type === 'Early Shift';
  const isEarlyFriday = type === 'Early Friday';
  // Early Shift / Early Friday: standalone timing change + Request Details only
  const isStandaloneTiming = isEarlyShift || isEarlyFriday;
  const timingLabel = isEarlyFriday ? 'Friday' : 'Shift';
  const usesRequestSections = isWFH || isHybrid || isStandaloneTiming;
  // Early Shift only needs Request Details (no assets / delivery / acknowledgement)
  const requestVariant = isStandaloneTiming ? 'requestOnly' : 'full';
  const needsHybridSchedule = isHybrid && duration === 'Permanent';
  // Permanent WFH / Hybrid have no dates (matches the web form); other permanent requests need an effective date
  const needsDates = !isWFO && !(usesRequestSections && duration === 'Permanent');
  const notesOnly = isWFO || usesRequestSections;
  const steps: Step[] = asksDuration ? ['type', 'duration', 'details'] : ['type', 'details'];
  const stepIndex = steps.indexOf(step);

  const clearError = (key: string) => setErrors((p) => ({ ...p, [key]: '' }));

  const goBack = () => (stepIndex <= 0 ? onExit() : setStep(steps[stepIndex - 1]));

  const next = () => {
    if (step === 'type' && type) setStep(asksDuration ? 'duration' : 'details');
    else if (step === 'duration' && duration) setStep('details');
  };

  const chooseType = (t: FlexType) => {
    if (t !== type) {
      // Details depend on the type, so start them fresh
      setDuration(null);
      setStartDate(null);
      setEndDate(null);
      setHybridForm(emptyHybridForm());
      setStartTime(null);
      setEndTime(null);
      setWfhForm(emptyWfhForm());
      setReason('');
      setErrors({});
    }
    setType(t);
  };

  const chooseDuration = (d: FlexDuration) => {
    if (d !== duration) {
      setStartDate(null);
      setEndDate(null);
    }
    setDuration(d);
  };

  const quickFill = () => {
    const inDays = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return toDateKey(d);
    };
    if (type === 'Work From Office') {
      setStartTime('09:00');
      setEndTime('18:00');
      setReason('Prefer an earlier in-office window to overlap with the US client morning calls.');
      setErrors({});
      return;
    }
    if (type === 'Early Shift' || type === 'Early Friday') {
      setStartTime(type === 'Early Friday' ? '09:00' : '08:00');
      setEndTime(type === 'Early Friday' ? '16:00' : '17:00');
      setStartDate(isPeriod ? inDays(5) : null);
      setEndDate(isPeriod ? inDays(33) : null);
      setWfhForm((prev) => ({ ...prev, reason: 'Medical Conditions in the Family' }));
      setReason('Need to be home by evening to care for a parent recovering from surgery.');
      setErrors({});
      return;
    }
    if (type === 'Work From Home' || type === 'Hybrid') {
      if (type === 'Hybrid' && !isPeriod) {
        setHybridForm({
          mode: 'Days',
          days: ['Wed', 'Thu', 'Fri'],
          wfoFrom: '10:00',
          wfoTo: '14:00',
          wfhFrom: '15:00',
          wfhTo: '19:00',
        });
      }
      setStartDate(isPeriod ? inDays(3) : null);
      setEndDate(isPeriod ? inDays(17) : null);
      setWfhForm((prev) => ({
        ...prev,
        reason: 'Medical Condition of Own-self',
        assets: { Laptop: 1, Headphones: 1 },
        accepted: true,
      }));
      setReason('Doctor has advised two weeks of rest after knee surgery; I can work fully online.');
      setErrors({});
      return;
    }
    setStartDate(inDays(7));
    setEndDate(isPeriod ? inDays(11) : null);
    setReason(
      type === 'Early Friday'
        ? 'I have evening classes for my certification course and need to leave earlier.'
        : 'Better focus on deep-work days while staying in sync with the team on collaboration days.'
    );
    setErrors({});
  };

  const submit = () => {
    if (!type) return;
    const found: Record<string, string> = {};
    if (isWFO) {
      if (!startTime) found.startTime = 'Select a start time.';
      if (!endTime) found.endTime = 'Select an end time.';
      else if (startTime && slotMinutes(endTime) <= slotMinutes(startTime)) found.endTime = 'End time must be after the start time.';
      setErrors(found);
      if (Object.values(found).some(Boolean)) return;
      setSubmitting(true);
      setTimeout(
        () => onSubmit({ type, startTime: startTime ?? undefined, endTime: endTime ?? undefined, reason: reason.trim() }),
        600
      );
      return;
    }
    if (usesRequestSections) {
      if (needsHybridSchedule) Object.assign(found, validateHybridForm(hybridForm));
      if (isPeriod) {
        if (!startDate || !endDate) found.date = 'Select the From and To dates.';
        else if (startDate < today) found.date = 'Dates must be today or later.';
      }
      if (isStandaloneTiming) {
        if (!startTime) found.startTime = `Select the ${timingLabel.toLowerCase()} start time.`;
        if (!endTime) found.endTime = `Select the ${timingLabel.toLowerCase()} end time.`;
        else if (startTime && slotMinutes(endTime) <= slotMinutes(startTime)) found.endTime = 'End time must be after the start time.';
      }
      Object.assign(found, validateWfhForm(wfhForm, requestVariant));
      setErrors(found);
      if (Object.values(found).some(Boolean)) return;
      const assets = isStandaloneTiming ? {} : wfhForm.assets;
      setSubmitting(true);
      setTimeout(
        () =>
          onSubmit({
            type,
            duration: duration ?? undefined,
            startDate: isPeriod ? startDate ?? undefined : undefined,
            endDate: isPeriod ? endDate ?? undefined : undefined,
            hybrid: needsHybridSchedule ? toHybridSchedule(hybridForm) : undefined,
            startTime: isStandaloneTiming ? startTime ?? undefined : undefined,
            endTime: isStandaloneTiming ? endTime ?? undefined : undefined,
            wfh: {
              reason: wfhForm.reason!,
              attachments: wfhForm.attachments.map((a) => a.name),
              assets,
              deliveryAddress: assetTotal(assets) > 0 ? wfhForm.address : undefined,
              acknowledgedBy: isStandaloneTiming ? undefined : signerName,
              acknowledgedOn: isStandaloneTiming ? undefined : today,
            },
            reason: reason.trim(),
          }),
        600
      );
      return;
    }
  };

  const TypeIcon = type ? FLEX_ICONS[type] : null;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Header + progress */}
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={goBack}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold ml-2">{isEditMode ? 'Edit Request' : 'Request Flexibility'}</h1>
          </div>
          {step === 'details' && (
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
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
            <span className="text-[#2F68FE]">
              Step {stepIndex + 1} of {steps.length}
            </span>
            <span className="text-slate-400">
              {step === 'type' ? 'Type' : step === 'duration' ? 'Duration' : 'Details'}
            </span>
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((s, i) => (
              <span key={s} className={`h-1.5 rounded-full transition-colors ${i <= stepIndex ? 'bg-[#2F68FE]' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {/* Step 1: type */}
        {step === 'type' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="px-1 pb-1">
              <h2 className="text-lg font-extrabold tracking-tight text-[#1E1B4B]">What kind of flexibility do you need?</h2>
              <p className="text-xs text-slate-500 mt-0.5">Pick the option that fits best — you can add details next.</p>
            </div>
            <div className="space-y-2.5" role="radiogroup" aria-label="Flexibility type">
              {FLEX_TYPES.map(({ type: t, description, tint }) => {
                const Icon = FLEX_ICONS[t];
                return (
                  <ChoiceCard
                    key={t}
                    selected={type === t}
                    onClick={() => chooseType(t)}
                    icon={<Icon className="w-5 h-5" />}
                    tint={tint}
                    title={t}
                    description={description}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: permanent / temporary */}
        {step === 'duration' && type && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="px-1 pb-1">
              <h2 className="text-lg font-extrabold tracking-tight text-[#1E1B4B]">Permanent or Temporary?</h2>
              <p className="text-xs text-slate-500 mt-0.5">For your {type.toLowerCase()} request.</p>
            </div>
            <div className="space-y-2.5" role="radiogroup" aria-label="Duration">
              <ChoiceCard
                selected={duration === 'Permanent'}
                onClick={() => chooseDuration('Permanent')}
                icon={<InfinityIcon className="w-5 h-5" />}
                tint="bg-indigo-50 text-indigo-600"
                title="Permanent"
                description="An ongoing change starting from an effective date"
              />
              <ChoiceCard
                selected={duration === 'Temporary'}
                onClick={() => chooseDuration('Temporary')}
                icon={<CalendarRange className="w-5 h-5" />}
                tint="bg-amber-50 text-amber-600"
                title="Temporary"
                description="Only for a specific period, then back to normal"
              />
            </div>
          </div>
        )}

        {/* Step 3: details */}
        {step === 'details' && type && TypeIcon && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Summary of earlier choices */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${flexMeta(type).tint}`}>
                <TypeIcon className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-[#1E293B]">{type}</span>
                <span className="block text-[11px] text-slate-500">
                  {asksDuration ? duration : 'Office working hours'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep('type')}
                className="text-[11px] font-semibold text-[#2F68FE] flex items-center gap-0.5 cursor-pointer"
              >
                Change
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Early Shift / Early Friday: standalone arrangement notice (important) */}
            {isStandaloneTiming && (
              <div
                role="note"
                className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] text-xs text-[#3730A3] leading-relaxed"
              >
                <Info className="w-4 h-4 shrink-0 mt-px text-[#4F46E5]" />
                <span>
                  You are requesting an {type} as a <strong className="font-bold">standalone</strong> arrangement -
                  without changing your current work mode.
                </span>
              </div>
            )}

            {/* Work From Office: office hours */}
            {isWFO && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1E293B]">
                  Office hours <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="block text-[10.5px] font-semibold text-slate-500">Start Time</span>
                    <Dropdown
                      ariaLabel="Start time"
                      value={startTime}
                      placeholder="Select From"
                      options={TIME_SLOTS}
                      onChange={(t) => {
                        setStartTime(t);
                        // Drop an end time that is no longer after the start
                        if (endTime && slotMinutes(endTime) <= slotMinutes(t)) setEndTime(null);
                        clearError('startTime');
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10.5px] font-semibold text-slate-500">End Time</span>
                    <Dropdown
                      ariaLabel="End time"
                      value={endTime}
                      placeholder="Select To"
                      options={TIME_SLOTS.map((t) => ({
                        value: t,
                        label: t,
                        disabled: Boolean(startTime && slotMinutes(t) <= slotMinutes(startTime)),
                      }))}
                      onChange={(t) => {
                        setEndTime(t);
                        clearError('endTime');
                      }}
                    />
                  </div>
                </div>
                <p className={`px-0.5 text-[11px] ${errors.startTime || errors.endTime ? 'font-medium text-rose-500' : 'text-slate-400'}`}>
                  {errors.startTime ||
                    errors.endTime ||
                    (startTime && endTime ? `${formatSpan(startTime, endTime)} in office` : `Current shift: ${CURRENT_SHIFT}`)}
                </p>
              </div>
            )}

            {/* Dates */}
            {needsDates && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1E293B]">
                {isPeriod ? 'Period' : 'Effective from'} <span className="text-rose-500">*</span>
              </label>
              {isPeriod ? (
                <div className="grid grid-cols-2 gap-2">
                  <DateButton label="From" value={startDate} onClick={() => setDatePicker('range')} invalid={Boolean(errors.date)} />
                  <DateButton label="To" value={endDate} onClick={() => setDatePicker('range')} invalid={Boolean(errors.date)} />
                </div>
              ) : (
                <DateButton label="Starting on" value={startDate} onClick={() => setDatePicker('single')} invalid={Boolean(errors.date)} />
              )}
              {errors.date && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.date}</p>}
            </div>
            )}

            {/* Work From Home: request details, assets, delivery address, acknowledgement */}
            {needsHybridSchedule && (
              <HybridScheduleFields value={hybridForm} onChange={setHybridForm} errors={errors} clearError={clearError} />
            )}

            {usesRequestSections && !isStandaloneTiming && (
              <WfhRequestFields
                value={wfhForm}
                onChange={setWfhForm}
                errors={errors}
                clearError={clearError}
                signerName={signerName}
                todayISO={today}
              />
            )}

            {/* Early Shift / Early Friday: timings */}
            {isStandaloneTiming && (
              <FormSection
                icon={isEarlyFriday ? <Calendar className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                title={`${timingLabel} Timings`}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 min-w-0">
                    <span className="block text-[11px] font-semibold text-slate-600">
                      {timingLabel} Start Time <span className="text-rose-500">*</span>
                    </span>
                    <Dropdown
                      ariaLabel={`${timingLabel} start time`}
                      value={startTime}
                      placeholder="Select From"
                      options={TIME_SLOTS}
                      onChange={(t) => {
                        setStartTime(t);
                        if (endTime && slotMinutes(endTime) <= slotMinutes(t)) setEndTime(null);
                        clearError('startTime');
                      }}
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <span className="block text-[11px] font-semibold text-slate-600">
                      {timingLabel} End Time <span className="text-rose-500">*</span>
                    </span>
                    <Dropdown
                      ariaLabel={`${timingLabel} end time`}
                      value={endTime}
                      placeholder="Select To"
                      options={TIME_SLOTS.map((t) => ({
                        value: t,
                        label: t,
                        disabled: Boolean(startTime && slotMinutes(t) <= slotMinutes(startTime)),
                      }))}
                      onChange={(t) => {
                        setEndTime(t);
                        clearError('endTime');
                      }}
                    />
                  </div>
                </div>
                <p className={`px-0.5 text-[11px] ${errors.startTime || errors.endTime ? 'font-medium text-rose-500' : 'text-slate-400'}`}>
                  {errors.startTime ||
                    errors.endTime ||
                    (startTime && endTime
                      ? `${isEarlyFriday ? 'Friday hours' : 'Shift length'} ${formatSpan(startTime, endTime)}`
                      : `Current shift: ${CURRENT_SHIFT}`)}
                </p>
              </FormSection>
            )}

            {isStandaloneTiming && (
              <WfhRequestFields
                value={wfhForm}
                onChange={setWfhForm}
                errors={errors}
                clearError={clearError}
                signerName={signerName}
                todayISO={today}
                variant="requestOnly"
              />
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1E293B]">
                {notesOnly ? (
                  <>
                    Notes <span className="font-medium text-slate-400">(Optional)</span>
                  </>
                ) : (
                  <>
                    Reason <span className="text-rose-500">*</span>
                  </>
                )}
              </label>
              <div className="relative">
                <textarea
                  rows={4}
                  value={reason}
                  maxLength={500}
                  onChange={(e) => {
                    setReason(e.target.value);
                    clearError('reason');
                  }}
                  placeholder={notesOnly ? 'Add any additional notes...' : 'Tell your manager why this would help you...'}
                  className={`w-full p-3.5 pb-7 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none shadow-2xs select-text ${
                    errors.reason ? 'border-rose-300' : 'border-slate-200'
                  }`}
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 pointer-events-none tabular-nums">
                  {reason.length}/500
                </span>
              </div>
              {errors.reason && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.reason}</p>}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[11px] text-[#1E40AF] leading-relaxed">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Your request will be sent to your reporting manager for approval.
            </div>
          </div>
        )}
      </div>

      {/* Footer action */}
      <div className="shrink-0 p-4 pb-5 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {step === 'details' ? (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? (isEditMode ? 'Updating…' : 'Submitting…') : isEditMode ? 'Update Request' : 'Submit Request'}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={step === 'type' ? !type : !duration}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Continue
          </button>
        )}
      </div>

      <DatePickerSheet
        isOpen={datePicker !== null}
        mode={datePicker ?? 'single'}
        title={datePicker === 'range' ? 'Select period' : 'Effective from'}
        start={startDate}
        end={endDate}
        minDate={today}
        onClose={() => setDatePicker(null)}
        onApply={(s, e) => {
          setStartDate(s);
          setEndDate(datePicker === 'range' ? e : null);
          setDatePicker(null);
          clearError('date');
        }}
      />
    </div>
  );
};
