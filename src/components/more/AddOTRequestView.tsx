import React, { useState } from 'react';
import { ArrowLeft, Wand2, Globe, Briefcase, Users, Timer, CalendarRange, StickyNote, Info } from 'lucide-react';
import { Dropdown } from '../../design-system/components/Dropdown';
import { FormSection } from './WfhRequestFields';
import { OTClientType, OTRequest } from '../../types/overtime';
import {
  OT_AVAILABILITY_TYPES,
  OT_COUNTRIES,
  OT_DOMAINS,
  OT_EXTRA_HOURS,
  otAvailabilityPeriod,
  otAvailabilityShort,
  otFte,
} from '../../data/overtimeData';

export type NewOTRequest = Pick<OTRequest, 'country' | 'domain' | 'clientType' | 'extraHours' | 'availability' | 'remarks'>;

interface AddOTRequestViewProps {
  onBack: () => void;
  onSubmit: (request: NewOTRequest) => void;
}

const MAX_REMARKS = 500;

/** Simple radio option (client type) */
const RadioOption: React.FC<{
  selected: boolean;
  onClick: () => void;
  label: string;
}> = ({ selected, onClick, label }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onClick}
    className={`h-11 px-3.5 flex items-center gap-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
      selected ? 'border-[#2F68FE] bg-blue-50/60' : 'border-slate-200 bg-white'
    }`}
  >
    <span
      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
        selected ? 'border-[#2F68FE]' : 'border-slate-300'
      }`}
    >
      {selected && <span className="w-2 h-2 rounded-full bg-[#2F68FE]" />}
    </span>
    <span className={`text-xs font-semibold ${selected ? 'text-[#1E293B]' : 'text-slate-600'}`}>{label}</span>
  </button>
);

export const AddOTRequestView: React.FC<AddOTRequestViewProps> = ({ onBack, onSubmit }) => {
  const [country, setCountry] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [clientType, setClientType] = useState<OTClientType | null>(null);
  const [extraHours, setExtraHours] = useState<number | null>(null);
  const [availability, setAvailability] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (key: string) => setErrors((p) => ({ ...p, [key]: '' }));
  const ready = Boolean(country && domain && clientType && extraHours && availability);

  const quickFill = () => {
    setCountry('United States');
    setDomain('Tax');
    setClientType('Existing');
    setExtraHours(2);
    setAvailability(OT_AVAILABILITY_TYPES[0]);
    setRemarks('Available for extra hours on US tax season engagements, especially during filing deadlines.');
    setErrors({});
  };

  const submit = () => {
    const found: Record<string, string> = {};
    if (!country) found.country = 'Select a country.';
    if (!domain) found.domain = 'Select a domain.';
    if (!clientType) found.clientType = 'Choose the client type.';
    if (!extraHours) found.extraHours = 'Select your extra available hours.';
    if (!availability) found.availability = 'Select the type of availability.';
    setErrors(found);
    if (Object.values(found).some(Boolean) || !country || !domain || !clientType || !extraHours || !availability) return;
    setSubmitting(true);
    setTimeout(() => onSubmit({ country, domain, clientType, extraHours, availability, remarks: remarks.trim() }), 600);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold ml-2">Add OT Request</h1>
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

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3.5">
        {/* Engagement */}
        <FormSection icon={<Globe className="w-4 h-4" />} title="Engagement">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600">
              Country <span className="text-rose-500">*</span>
            </label>
            <Dropdown
              ariaLabel="Country"
              value={country}
              placeholder="Please Select"
              options={OT_COUNTRIES}
              onChange={(v) => {
                setCountry(v);
                clearError('country');
              }}
            />
            {errors.country && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.country}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600">
              Domain <span className="text-rose-500">*</span>
            </label>
            <Dropdown
              ariaLabel="Domain"
              value={domain}
              placeholder="Please Select"
              icon={<Briefcase className="w-4 h-4" />}
              options={OT_DOMAINS}
              onChange={(v) => {
                setDomain(v);
                clearError('domain');
              }}
            />
            {errors.domain && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.domain}</p>}
          </div>
        </FormSection>

        {/* Client type */}
        <FormSection icon={<Users className="w-4 h-4" />} title="Client Type">
          <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Client type">
            {(['Existing', 'New'] as const).map((type) => (
              <RadioOption
                key={type}
                selected={clientType === type}
                onClick={() => {
                  setClientType(type);
                  clearError('clientType');
                }}
                label={type}
              />
            ))}
          </div>
          {errors.clientType && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.clientType}</p>}
        </FormSection>

        {/* Extra hours (required) */}
        <FormSection icon={<Timer className="w-4 h-4" />} title="Extra Available Hours">
          <label className="block text-[11px] font-semibold text-slate-600">
            How many extra hours a day can you take on? <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Extra available hours">
            {OT_EXTRA_HOURS.map((h) => {
              const on = extraHours === h;
              return (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setExtraHours(h);
                    clearError('extraHours');
                  }}
                  className={`relative pt-3 pb-2.5 rounded-xl border flex flex-col items-center transition-colors cursor-pointer active:scale-[0.98] ${
                    on ? 'border-[#2F68FE] bg-blue-50/60' : errors.extraHours ? 'border-rose-300 bg-white' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span
                    className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      on ? 'border-[#2F68FE]' : 'border-slate-300'
                    }`}
                  >
                    {on && <span className="w-1.5 h-1.5 rounded-full bg-[#2F68FE]" />}
                  </span>
                  <span className={`text-lg font-extrabold leading-none tabular-nums ${on ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}>{h}</span>
                  <span className={`mt-0.5 text-[10px] font-semibold ${on ? 'text-[#2F68FE]' : 'text-slate-500'}`}>hrs / day</span>
                  <span className="mt-1.5 text-[9.5px] text-slate-400 tabular-nums">{otFte(h)} FTE</span>
                </button>
              );
            })}
          </div>
          {errors.extraHours ? (
            <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.extraHours}</p>
          ) : (
            extraHours && (
              <p className="px-0.5 text-[11px] text-slate-500">
                That's <strong className="font-bold text-[#1E293B]">{otFte(extraHours)} FTE</strong> on top of your regular day.
              </p>
            )
          )}
        </FormSection>

        {/* Availability */}
        <FormSection icon={<CalendarRange className="w-4 h-4" />} title="Type of Availability">
          <Dropdown
            ariaLabel="Type of availability"
            value={availability}
            placeholder="Please Select"
            options={OT_AVAILABILITY_TYPES.map((a) => ({ value: a, label: otAvailabilityShort(a), description: otAvailabilityPeriod(a) }))}
            onChange={(v) => {
              setAvailability(v);
              clearError('availability');
            }}
          />
          {availability ? (
            <p className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
              <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {otAvailabilityPeriod(availability)}
            </p>
          ) : (
            errors.availability && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.availability}</p>
          )}
        </FormSection>

        {/* Remarks */}
        <FormSection icon={<StickyNote className="w-4 h-4" />} title="Remarks" right={<span className="text-[10px] text-slate-400">Optional</span>}>
          <div className="relative">
            <textarea
              rows={3}
              value={remarks}
              maxLength={MAX_REMARKS}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Anything your manager should know..."
              className="w-full p-3.5 pb-7 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text"
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 pointer-events-none tabular-nums">
              {remarks.length}/{MAX_REMARKS}
            </span>
          </div>
        </FormSection>

        {/* Live summary */}
        {ready && (
          <section className="rounded-2xl bg-linear-to-br from-[#EEF2FF] to-[#F5F3FF] border border-indigo-100 p-3.5 animate-in fade-in duration-200">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#4F46E5]">Summary</span>
            <p className="mt-1 text-xs text-[#1E1B4B] leading-relaxed">
              <strong className="font-bold">{domain}</strong> · {clientType} client · {country}
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Extra hrs', value: extraHours ?? '—' },
                { label: 'FTE', value: extraHours ? otFte(extraHours) : '—' },
                { label: 'Availability', value: otAvailabilityShort(availability!).replace('Temporary Extended', 'Temp. Ext.') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/80 rounded-xl py-2 px-1">
                  <span className="block text-[13px] font-extrabold text-[#1E293B] tabular-nums">{value}</span>
                  <span className="block text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          You can submit only one OT request. It's approved automatically and can't be edited afterwards — to change it, raise a ticket.
        </p>
      </div>

      <div className="shrink-0 p-4 pb-5 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {submitting ? 'Submitting…' : 'Submit OT Request'}
        </button>
      </div>
    </div>
  );
};
