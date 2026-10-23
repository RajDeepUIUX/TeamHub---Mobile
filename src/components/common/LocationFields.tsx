import React from 'react';
import { Dropdown } from '../../design-system/components/Dropdown';
import { COUNTRY_OPTIONS, citiesOf, statesOf } from '../../data/locations';

export interface LocationValue {
  country: string | null;
  state: string;
  city: string;
}

/**
 * Country → State → City, the one rule for every location form in the app:
 * State unlocks once a Country is picked, City once a State is picked, and changing a level clears the ones below it.
 * Countries / states we have lists for show dropdowns; anything else falls back to a text box.
 *
 * Layout: Country | State, then City | `extra` (e.g. Year of completion, Pincode).
 */
export const LocationFields: React.FC<{
  value: LocationValue;
  onChange: (patch: Partial<LocationValue>) => void;
  required?: boolean;
  errors?: Partial<Record<keyof LocationValue, string>>;
  /** Optional 4th cell, next to City */
  extra?: React.ReactNode;
  /** Restrict the country list (defaults to all countries) */
  countries?: string[];
}> = ({ value, onChange, required = false, errors = {}, extra, countries = COUNTRY_OPTIONS }) => {
  const states = statesOf(value.country);
  const cities = citiesOf(value.country, value.state);

  const label = (text: string) => (
    <span className="block text-[11px] font-semibold text-slate-600 mb-1">
      {text}
      {required && <span className="text-rose-500"> *</span>}
    </span>
  );
  const err = (m?: string) => (m ? <p className="mt-1 px-0.5 text-[11px] font-medium text-rose-500">{m}</p> : null);
  const inputCls = (bad?: string) =>
    `w-full h-11 px-3.5 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
      bad ? 'border-rose-300' : 'border-slate-200'
    }`;
  const locked = (text: string) => (
    <div className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-xs font-medium text-slate-400 truncate">
      {text}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
      <div className="min-w-0" data-field="country">
        {label('Country')}
        <Dropdown
          size="md"
          forceSheet
          ariaLabel="Country"
          value={value.country}
          placeholder="— Select —"
          options={countries}
          onChange={(v) => v !== value.country && onChange({ country: v, state: '', city: '' })}
        />
        {err(errors.country)}
      </div>

      <div className="min-w-0" data-field="state">
        {label('State')}
        {!value.country
          ? locked('Select country first')
          : states ? (
              <Dropdown
                size="md"
                forceSheet
                ariaLabel="State"
                value={value.state || null}
                placeholder="— Select —"
                options={states}
                onChange={(v) => v !== value.state && onChange({ state: v, city: '' })}
              />
            ) : (
              <input
                value={value.state}
                placeholder="Enter state"
                onChange={(e) => onChange({ state: e.target.value, city: '' })}
                className={inputCls(errors.state)}
              />
            )}
        {err(errors.state)}
      </div>

      <div className="min-w-0" data-field="city">
        {label('City')}
        {!value.state.trim()
          ? locked('Select state first')
          : cities ? (
              <Dropdown
                size="md"
                forceSheet
                ariaLabel="City"
                value={value.city || null}
                placeholder="— Select —"
                options={cities}
                onChange={(v) => onChange({ city: v })}
              />
            ) : (
              <input value={value.city} placeholder="Enter city" onChange={(e) => onChange({ city: e.target.value })} className={inputCls(errors.city)} />
            )}
        {err(errors.city)}
      </div>

      {extra !== undefined && <div className="min-w-0">{extra}</div>}
    </div>
  );
};
