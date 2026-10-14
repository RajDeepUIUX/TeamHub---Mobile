import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarClock, CalendarRange, Check, Info, MapPin, Repeat, Infinity as InfinityIcon } from 'lucide-react';
import { Dropdown } from '../../design-system/components/Dropdown';
import { DatePickerSheet } from '../common/DatePickerSheet';
import { todayIso } from '../common/DateWheelSheet';
import { DateButton, ErrorText, FieldLabel, fieldBoxClass, fieldTextClass } from '../profile/reviewFormParts';
import {
  CAB_CITIES,
  CITY_NAMES,
  CabDraft,
  CabFor,
  CabRequest,
  CabRequestType,
  PICKUP_TIMES,
  WEEKDAYS,
  Weekday,
  findClash,
  prettyArea,
} from '../../data/cabRequestData';

interface CabRequestFormViewProps {
  /** The signed-in user's own requests (used to catch clashing dates) */
  requests: CabRequest[];
  /** Set when editing a pending request */
  initial?: CabRequest;
  onBack: () => void;
  onSubmit: (draft: CabDraft) => void;
}

type Errors = Record<string, string>;

const Required: React.FC = () => <span className="text-rose-500"> *</span>;

/** Red outline around a control that failed validation */
const Invalid: React.FC<{ when: boolean; children: React.ReactNode }> = ({ when, children }) => (
  <div className={`rounded-xl transition-shadow ${when ? 'ring-2 ring-rose-300 ring-offset-2 ring-offset-white' : ''}`}>{children}</div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
    <h2 className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 text-[12.5px] font-bold text-[#1E1B4B]">{title}</h2>
    <div className="p-4 space-y-3.5">{children}</div>
  </section>
);

interface PillOption<T extends string> {
  value: T;
  label: string;
  icon: React.ElementType;
  hint: string;
}

/** Compact two-way toggle (same look as SegmentedTabs) with a one-line hint for the chosen option */
function PillToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: PillOption<T>[];
  onChange: (value: T) => void;
}) {
  const hint = options.find((o) => o.value === value)?.hint;
  return (
    <div>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60"
      >
        {options.map(({ value: v, label: text, icon: Icon }) => {
          const on = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(v)}
              className={`h-10 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                on ? 'bg-white text-[#2F68FE] font-bold shadow-[0_1px_3px_rgba(15,23,42,0.12)]' : 'text-slate-500 font-semibold'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {text}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 px-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export const CabRequestFormView: React.FC<CabRequestFormViewProps> = ({ requests, initial, onBack, onSubmit }) => {
  const today = todayIso();
  const [cabFor, setCabFor] = useState<CabFor>(initial?.cabFor ?? 'One Time');
  const [requestType, setRequestType] = useState<CabRequestType | null>(initial?.requestType ?? null);
  const [fromDate, setFromDate] = useState(initial?.fromDate ?? '');
  const [toDate, setToDate] = useState(initial?.toDate ?? '');
  const [pickupTime, setPickupTime] = useState(initial?.pickupTime ?? '');
  const [days, setDays] = useState<Weekday[]>(initial?.days ?? []);
  const [city, setCity] = useState(initial?.city ?? '');
  const [dropArea, setDropArea] = useState(initial?.dropArea ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [dateOpen, setDateOpen] = useState<'from' | 'to' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Bumped on every failed submit so the jump runs after the errors have rendered
  const [failedSubmits, setFailedSubmits] = useState(0);

  const daily = cabFor === 'Daily Basis';
  const needsDates = cabFor === 'One Time' || (daily && requestType === 'Temporary');
  const showDetails = cabFor === 'One Time' || (daily && requestType !== null);
  // Weekdays only apply to a permanent daily cab (Temporary runs every working day in its date range)
  const needsDays = daily && requestType === 'Permanent';
  const allDays = days.length === WEEKDAYS.length;

  const clear = (...keys: string[]) =>
    setErrors((prev) => {
      keys = [...keys, 'clash'];
      if (!keys.some((k) => k in prev)) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const chooseCabFor = (v: CabFor) => {
    if (v === cabFor) return;
    setCabFor(v);
    setRequestType(v === 'Daily Basis' ? 'Temporary' : null);
    setFromDate('');
    setToDate('');
    setDays([]);
    setErrors({});
  };

  const chooseRequestType = (v: CabRequestType) => {
    setRequestType(v);
    if (v === 'Permanent') {
      setFromDate('');
      setToDate('');
    } else {
      setDays([]);
    }
    clear('requestType', 'dates', 'days');
  };

  const toggleDay = (d: Weekday) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : WEEKDAYS.filter((x) => x === d || prev.includes(x))));
    clear('days');
  };

  const buildDraft = (): CabDraft => ({
    cabFor,
    requestType: daily ? requestType! : undefined,
    fromDate: needsDates ? fromDate : undefined,
    toDate: needsDates ? (cabFor === 'One Time' ? fromDate : toDate) : undefined,
    pickupTime,
    days: needsDays ? days : [],
    city,
    dropArea,
  });

  const validate = (): Errors => {
    const e: Errors = {};
    if (daily && !requestType) {
      e.requestType = 'Choose Temporary or Permanent.';
      return e;
    }
    if (needsDates && !fromDate) e.dates = cabFor === 'One Time' ? 'Pick the date you need the cab.' : 'Pick the from date.';
    else if (daily && requestType === 'Temporary' && !toDate) e.dates = 'Pick the to date as well.';
    if (!pickupTime) e.pickupTime = 'Select a pickup time.';
    if (needsDays && days.length === 0) e.days = 'Select at least one day.';
    if (!city) e.city = 'Select your city.';
    if (!dropArea) e.dropArea = 'Select where you want to be dropped.';
    if (Object.keys(e).length === 0) {
      const clash = findClash(buildDraft(), requests, today, initial?.id);
      if (clash) e.clash = clash;
    }
    return e;
  };

  const handleSubmit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      setFailedSubmits((n) => n + 1);
      return;
    }
    onSubmit(buildDraft());
  };

  /** Scroll the first problem to the top of the form, focus it and give it a nudge */
  const jumpToFirstError = () => {
    const container = scrollRef.current;
    const target = container?.querySelector<HTMLElement>('[data-invalid="true"]');
    if (!container || !target) return;
    const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTo({
      top: Math.max(0, container.scrollTop + offset - 16),
      behavior: 'smooth',
    });
    target.querySelector<HTMLElement>('button:not([disabled]), input, textarea')?.focus({ preventScroll: true });
    target.animate?.(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 380, delay: 250, easing: 'ease-out' }
    );
  };

  useEffect(() => {
    if (failedSubmits) jumpToFirstError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failedSubmits]);

  // A clash isn't tied to one field, so it gets its own message instead of the field count
  const errorCount = Object.keys(errors).filter((k) => k !== 'clash').length;
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
          <h1 className="text-base font-bold screen-title">{initial ? 'Edit Cab Request' : 'Request a Cab'}</h1>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {errors.clash && (
          <div
            data-invalid="true"
            className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11.5px] font-semibold text-rose-600 leading-snug"
          >
            <Info className="w-4 h-4 shrink-0 mt-px" />
            {errors.clash}
          </div>
        )}
        {errorCount > 0 && (
          <button
            type="button"
            onClick={jumpToFirstError}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11.5px] font-semibold text-rose-600 text-left cursor-pointer active:bg-rose-100"
          >
            <Info className="w-4 h-4 shrink-0" />
            <span className="flex-1">
              {errorCount === 1 ? '1 field needs your attention.' : `${errorCount} fields need your attention.`}
            </span>
            <span className="text-[11px] font-bold underline underline-offset-2">Show me</span>
          </button>
        )}

        <Section title="Request Details">
          <div>
            <FieldLabel>
              Requesting Cab For
              <Required />
            </FieldLabel>
            <PillToggle<CabFor>
              label="Requesting cab for"
              value={cabFor}
              onChange={chooseCabFor}
              options={[
                {
                  value: 'One Time',
                  label: 'One Time',
                  icon: CalendarClock,
                  hint: 'A single drop on one date.',
                },
                {
                  value: 'Daily Basis',
                  label: 'Daily Basis',
                  icon: Repeat,
                  hint: 'A regular drop for a date range, or ongoing.',
                },
              ]}
            />
          </div>

          {daily && (
            <div data-invalid={Boolean(errors.requestType) || undefined}>
              <FieldLabel>
                Request Type
                <Required />
              </FieldLabel>
              <PillToggle<CabRequestType>
                label="Request type"
                value={requestType}
                onChange={chooseRequestType}
                options={[
                  {
                    value: 'Temporary',
                    label: 'Temporary',
                    icon: CalendarRange,
                    hint: 'Runs between the dates you pick.',
                  },
                  {
                    value: 'Permanent',
                    label: 'Permanent',
                    icon: InfinityIcon,
                    hint: 'Runs until you stop it.',
                  },
                ]}
              />
              <div className="mt-1">
                <ErrorText message={errors.requestType} />
              </div>
            </div>
          )}
        </Section>

        {showDetails && (
          <Section title="Trip Details">
            {needsDates && (
              <div data-invalid={Boolean(errors.dates) || undefined}>
                {cabFor === 'One Time' ? (
                  <DateButton label="Date *" value={fromDate} onClick={() => setDateOpen('from')} />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <DateButton label="From Date *" value={fromDate} onClick={() => setDateOpen('from')} />
                    <DateButton label="To Date *" value={toDate} disabled={!fromDate} onClick={() => setDateOpen('to')} />
                  </div>
                )}
                <div className="mt-1">
                  <ErrorText message={errors.dates} />
                </div>
              </div>
            )}

            <div data-invalid={Boolean(errors.pickupTime) || undefined}>
              <FieldLabel>
                Pickup Time
                <Required />
              </FieldLabel>
              <Invalid when={Boolean(errors.pickupTime)}>
                <Dropdown<string>
                  value={pickupTime || null}
                  options={PICKUP_TIMES}
                  onChange={(v) => {
                    setPickupTime(v);
                    clear('pickupTime');
                  }}
                  placeholder="Select time"
                  ariaLabel="Pickup time"
                  sheetTitle="Pickup time"
                />
              </Invalid>
              <div className="mt-1">
                <ErrorText message={errors.pickupTime} />
              </div>
            </div>

            {needsDays && (
              <div data-invalid={Boolean(errors.days) || undefined}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10.5px] font-semibold text-slate-500">
                    Days
                    <Required />
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDays(allDays ? [] : [...WEEKDAYS]);
                      clear('days');
                    }}
                    className="text-[11px] font-bold text-[#2F68FE] cursor-pointer"
                  >
                    {allDays ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <Invalid when={Boolean(errors.days)}>
                  <div className="grid grid-cols-5 gap-1.5">
                    {WEEKDAYS.map((d) => {
                      const on = days.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          aria-pressed={on}
                          aria-label={d}
                          className={`h-11 rounded-xl border text-[11.5px] font-bold transition-colors cursor-pointer ${
                            on ? 'border-[#2F68FE] bg-[#2F68FE] text-white' : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
                          }`}
                        >
                          {d.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </Invalid>
                <div className="mt-1">
                  <ErrorText message={errors.days} />
                </div>
              </div>
            )}
          </Section>
        )}

        {showDetails && (
          <Section title="Drop Location">
            <div data-invalid={Boolean(errors.city) || undefined}>
              <FieldLabel>
                City
                <Required />
              </FieldLabel>
              <Invalid when={Boolean(errors.city)}>
                <Dropdown<string>
                  value={city || null}
                  options={CITY_NAMES}
                  onChange={(v) => {
                    if (v !== city) setDropArea('');
                    setCity(v);
                    clear('city');
                  }}
                  placeholder="Select city"
                  ariaLabel="City"
                  sheetTitle="Select city"
                />
              </Invalid>
              <div className="mt-1">
                <ErrorText message={errors.city} />
              </div>
            </div>

            <div data-invalid={Boolean(errors.dropArea) || undefined}>
              <FieldLabel>
                Drop Area
                <Required />
              </FieldLabel>
              <Invalid when={Boolean(errors.dropArea)}>
                {city ? (
                  <Dropdown<string>
                    key={city}
                    value={dropArea || null}
                    options={CAB_CITIES[city].map((a) => ({
                      value: a,
                      label: prettyArea(a),
                    }))}
                    onChange={(v) => {
                      setDropArea(v);
                      clear('dropArea');
                    }}
                    placeholder="Select area"
                    ariaLabel="Drop area"
                    sheetTitle={`Drop area in ${city}`}
                  />
                ) : (
                  <div className={`${fieldBoxClass} bg-slate-50 shadow-none flex items-center gap-2.5`}>
                    <MapPin className="w-4 h-4 text-slate-300 shrink-0" />
                    <span className={fieldTextClass(false)}>Select a city first</span>
                  </div>
                )}
              </Invalid>
              <div className="mt-1">
                <ErrorText message={errors.dropArea} />
              </div>
            </div>
          </Section>
        )}

        {showDetails && (
          <p className="flex items-start gap-1.5 px-1 text-[11px] text-slate-500 leading-snug">
            <Info className="w-3.5 h-3.5 text-[#2F68FE] shrink-0 mt-px" />
            Your reporting manager reviews the request. Once approved, the transport desk shares the route and driver details.
          </p>
        )}
      </div>

      <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
          {initial ? 'Update Request' : 'Submit Request'}
        </button>
      </div>

      <DatePickerSheet
        isOpen={dateOpen !== null}
        mode="single"
        title={cabFor === 'One Time' ? 'Cab Date' : dateOpen === 'to' ? 'To Date' : 'From Date'}
        start={(dateOpen === 'to' ? toDate : fromDate) || null}
        minDate={dateOpen === 'to' ? fromDate || today : today}
        onClose={() => setDateOpen(null)}
        onApply={(iso) => {
          if (dateOpen === 'to') {
            setToDate(iso);
          } else {
            setFromDate(iso);
            if (cabFor === 'One Time') setToDate(iso);
            // Keep the range valid if the start moves past the end
            else if (toDate && toDate < iso) setToDate('');
          }
          clear('dates');
          setDateOpen(null);
        }}
      />
    </div>
  );
};
