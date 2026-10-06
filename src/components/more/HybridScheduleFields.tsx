import React from 'react';
import { CalendarCheck, Building2, Home } from 'lucide-react';
import { TimeField } from '../common/TimeField';
import { FormSection } from './WfhRequestFields';
import { WEEKDAYS, formatSpan, slotMinutes } from '../../data/workTimingData';
import { HybridSchedule } from '../../types/workTiming';

/** Form state for the permanent Hybrid schedule */
export interface HybridFormState {
  mode: 'Days' | 'Daily' | null;
  days: string[];
  wfoFrom: string | null;
  wfoTo: string | null;
  wfhFrom: string | null;
  wfhTo: string | null;
}

export const emptyHybridForm = (): HybridFormState => ({
  mode: null,
  days: [],
  wfoFrom: null,
  wfoTo: null,
  wfhFrom: null,
  wfhTo: null,
});

export const validateHybridForm = (h: HybridFormState): Record<string, string> => {
  const e: Record<string, string> = {};
  if (!h.mode) e.hybridMode = 'Choose Days or Daily.';
  if (h.mode === 'Days' && h.days.length === 0) e.hybridDays = 'Select at least one day.';
  if (!h.wfoFrom || !h.wfoTo) e.wfo = 'Select the office From and To times.';
  if (!h.wfhFrom || !h.wfhTo) e.wfh = 'Select the home From and To times.';
  return e;
};

export const toHybridSchedule = (h: HybridFormState): HybridSchedule => ({
  mode: h.mode!,
  days: h.mode === 'Days' ? WEEKDAYS.filter((d) => h.days.includes(d)) : undefined,
  wfoFrom: h.wfoFrom!,
  wfoTo: h.wfoTo!,
  wfhFrom: h.wfhFrom!,
  wfhTo: h.wfhTo!,
});

/** Earliest allowed time for a field: strictly after `after`, or from it when `inclusive` */
interface TimeLimit {
  after: string | null;
  inclusive?: boolean;
}

/** One tinted block (WFO / WFH) with From + To times and a duration chip */
const TimeBlock: React.FC<{
  tone: 'wfo' | 'wfh';
  from: string | null;
  to: string | null;
  fromLimit: TimeLimit;
  toLimit: TimeLimit;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  error?: string;
}> = ({ tone, from, to, fromLimit, toLimit, onFrom, onTo, error }) => {
  const isWfo = tone === 'wfo';
  return (
    <div
      className={`rounded-2xl border p-3 space-y-2.5 ${
        isWfo ? 'bg-[#F5F7FF] border-[#DDE3FB]' : 'bg-[#FFFAF0] border-[#FBE5C0]'
      } ${error ? 'ring-2 ring-rose-100' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
            isWfo ? 'bg-[#E4E9FD] text-[#2F68FE]' : 'bg-[#FDEBCB] text-[#C2710C]'
          }`}
        >
          {isWfo ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
          {isWfo ? 'WFO' : 'WFH'}
        </span>
        {from && to && (
          <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-semibold text-slate-500 shadow-2xs tabular-nums">
            Duration: {formatSpan(from, to)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1 min-w-0">
          <span className="block text-[10.5px] font-semibold text-slate-600">From Time</span>
          <TimeField
            title={`${isWfo ? 'Office' : 'Home'} From Time`}
            value={from}
            placeholder="Select From"
            after={fromLimit.after}
            inclusive={fromLimit.inclusive}
            invalid={Boolean(error && !from)}
            onChange={onFrom}
          />
        </div>
        <div className="space-y-1 min-w-0">
          <span className="block text-[10.5px] font-semibold text-slate-600">To Time</span>
          <TimeField
            title={`${isWfo ? 'Office' : 'Home'} To Time`}
            value={to}
            placeholder="Select To"
            after={toLimit.after}
            inclusive={toLimit.inclusive}
            invalid={Boolean(error && !to)}
            onChange={onTo}
          />
        </div>
      </div>
      {error && <p className="text-[11px] font-medium text-rose-500">{error}</p>}
    </div>
  );
};

interface HybridScheduleFieldsProps {
  value: HybridFormState;
  onChange: (next: HybridFormState) => void;
  errors: Record<string, string>;
  clearError: (key: string) => void;
}

export const HybridScheduleFields: React.FC<HybridScheduleFieldsProps> = ({ value: h, onChange, errors, clearError }) => {
  const set = (patch: Partial<HybridFormState>) => onChange({ ...h, ...patch });
  const allDays = h.days.length === WEEKDAYS.length;

  const toggleDay = (d: string) => {
    set({ days: h.days.includes(d) ? h.days.filter((x) => x !== d) : [...h.days, d] });
    clearError('hybridDays');
  };

  // Changing an earlier time clears later times that would no longer follow it
  const setWfoFrom = (v: string) => {
    const wfoTo = h.wfoTo && slotMinutes(h.wfoTo) > slotMinutes(v) ? h.wfoTo : null;
    set({ wfoFrom: v, wfoTo, ...(wfoTo ? {} : { wfhFrom: null, wfhTo: null }) });
    clearError('wfo');
  };
  const setWfoTo = (v: string) => {
    const wfhFrom = h.wfhFrom && slotMinutes(h.wfhFrom) >= slotMinutes(v) ? h.wfhFrom : null;
    set({ wfoTo: v, wfhFrom, wfhTo: wfhFrom ? h.wfhTo : null });
    clearError('wfo');
  };
  const setWfhFrom = (v: string) => {
    const wfhTo = h.wfhTo && slotMinutes(h.wfhTo) > slotMinutes(v) ? h.wfhTo : null;
    set({ wfhFrom: v, wfhTo });
    clearError('wfh');
  };

  return (
    <FormSection icon={<CalendarCheck className="w-4 h-4" />} title="Hybrid Information">
      {/* Days vs Daily */}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Hybrid schedule">
        {(['Days', 'Daily'] as const).map((m) => {
          const on = h.mode === m;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                set({ mode: m });
                clearError('hybridMode');
              }}
              className={`h-11 rounded-xl border text-left px-3 flex items-center gap-2 cursor-pointer ${
                on ? 'border-[#2F68FE] bg-blue-50' : errors.hybridMode ? 'border-rose-300 bg-white' : 'border-slate-200 bg-white'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${on ? 'border-[#2F68FE] bg-[#2F68FE] ring-2 ring-white ring-inset' : 'border-slate-300'}`} />
              <span className="min-w-0">
                <span className={`block text-xs ${on ? 'font-bold text-[#1E293B]' : 'font-semibold text-slate-600'}`}>{m}</span>
                <span className="block text-[10px] text-slate-400 truncate">{m === 'Days' ? 'Selected weekdays' : 'Every working day'}</span>
              </span>
            </button>
          );
        })}
      </div>
      {errors.hybridMode && <p className="-mt-1 px-0.5 text-[11px] font-medium text-rose-500">{errors.hybridMode}</p>}

      {h.mode && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Weekday picker (Days mode) */}
          {h.mode === 'Days' && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-6 gap-1.5">
                <button
                  type="button"
                  aria-pressed={allDays}
                  onClick={() => {
                    set({ days: allDays ? [] : [...WEEKDAYS] });
                    clearError('hybridDays');
                  }}
                  className={`h-11 rounded-xl border text-[11px] font-bold cursor-pointer ${
                    allDays ? 'border-[#1E293B] bg-[#1E293B] text-white' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  All
                </button>
                {WEEKDAYS.map((d) => {
                  const on = h.days.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleDay(d)}
                      className={`h-11 rounded-xl border text-[11px] font-bold flex items-center justify-center cursor-pointer ${
                        on ? 'border-[#2F68FE] bg-[#2F68FE] text-white' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className={`px-0.5 text-[11px] ${errors.hybridDays ? 'font-medium text-rose-500' : 'text-slate-400'}`}>
                {errors.hybridDays ||
                  (h.days.length ? `The split below applies on ${h.days.length} ${h.days.length === 1 ? 'day' : 'days'} a week` : 'Pick the days that follow this split')}
              </p>
            </div>
          )}

          <TimeBlock
            tone="wfo"
            from={h.wfoFrom}
            to={h.wfoTo}
            fromLimit={{ after: null }}
            toLimit={{ after: h.wfoFrom }}
            onFrom={setWfoFrom}
            onTo={setWfoTo}
            error={errors.wfo}
          />
          <TimeBlock
            tone="wfh"
            from={h.wfhFrom}
            to={h.wfhTo}
            // Home time starts once office time ends
            fromLimit={{ after: h.wfoTo, inclusive: true }}
            toLimit={{ after: h.wfhFrom }}
            onFrom={setWfhFrom}
            onTo={(v) => {
              set({ wfhTo: v });
              clearError('wfh');
            }}
            error={errors.wfh}
          />
        </div>
      )}
    </FormSection>
  );
};
