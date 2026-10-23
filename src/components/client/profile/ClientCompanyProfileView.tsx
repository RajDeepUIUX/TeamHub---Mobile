import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, FileText, Image as ImageIcon, Pencil } from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { ConfirmSheet, DesignVersion, ScreenHeader, fieldInputClass, useNotice } from '../staff/tabs/StaffTabParts';
import { useClientPermission } from '../context/ClientPermissionContext';
import { CompanyLogoSheet } from './CompanyLogoSheet';
import {
  DisabledSelect,
  ErrorText,
  Label,
  LockedField,
  ProfileSkeleton,
  RemovableTags,
} from './ProfileParts';
import { CLIENT_COUNTRIES, CLIENT_TIME_ZONES, citiesOf, statesOf, timeZoneLabel } from '../data/clientUserProfileData';
import {
  BUSINESS_TYPES,
  COMPANY_LIMITS,
  ClientAgreement,
  ClientCompanyProfile,
  EMPLOYEE_SIZES,
  INDUSTRY_OPTIONS,
  SERVICE_OPTIONS,
  businessTypeLabel,
  formatCompanyPhone,
  isValidUrl,
  shortUrl,
} from '../data/clientCompanyProfileData';

const LOAD_MS = 600;
const DESIGN_VERSIONS = ['V1', 'V2'] as const;

type FieldKey =
  | 'companyName'
  | 'businessType'
  | 'industries'
  | 'phone'
  | 'timeZone'
  | 'address1'
  | 'country'
  | 'state'
  | 'city'
  | 'zipCode'
  | 'website'
  | 'linkedin'
  | 'twitter'
  | 'facebook';
type Errors = Partial<Record<FieldKey, string>>;

const digitsOnly = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);
const onlyZeros = (v: string) => /^0+$/.test(v.replace(/\D/g, ''));

/** B `#my-company-update` rules (+ zip ≥5 digits, Added by designer) */
const validate = (p: ClientCompanyProfile): Errors => {
  const e: Errors = {};
  if (!p.companyName.trim()) e.companyName = 'Please enter company name.';
  if (!p.businessType) e.businessType = 'Please select business type.';
  if (!p.industries.length) e.industries = 'Please select at least one industry.';
  const phone = p.phone.replace(/\D/g, '');
  if (!phone) e.phone = 'Please enter phone number.';
  else if (phone.length !== 10 || onlyZeros(phone)) e.phone = 'Please enter a valid phone number.';
  if (!p.timeZone) e.timeZone = 'Please select time zone.';
  if (!p.address1.trim()) e.address1 = 'Please enter address.';
  if (!p.country) e.country = 'Please select country.';
  if (!p.state) e.state = 'Please select state.';
  if (!p.city) e.city = 'Please select city.';
  if (!p.zipCode) e.zipCode = 'Please enter zip code.';
  else if (onlyZeros(p.zipCode) || p.zipCode.length < 5) e.zipCode = 'Please enter a valid zip code.';
  (['website', 'linkedin', 'twitter', 'facebook'] as const).forEach((k) => {
    if (p[k] && !isValidUrl(p[k])) e[k] = 'Please enter a valid URL, starting with https://';
  });
  return e;
};

/* ------------------------------- View parts ------------------------------- */

type ValueRow = { label: string; value: string; wide?: boolean };

const inputClassV2 = (error?: string) =>
  `w-full h-11 px-3 bg-[#F8FAFC] border rounded-lg text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-[#2F68FE] focus:ring-2 focus:ring-blue-100 select-text ${
    error ? 'border-rose-300' : 'border-slate-200'
  }`;

/** V1 = banded card; V2 = flat card with blue-bar uppercase title */
const Section: React.FC<{ v2: boolean; title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ v2, title, action, children }) =>
  v2 ? (
    <section className="bg-white rounded-2xl border border-[#E6EBF2] shadow-[0_4px_16px_-8px_rgba(15,23,42,0.14)] overflow-hidden">
      <h2 className="px-4 py-3 flex items-center gap-2.5 border-b border-slate-100 bg-linear-to-r from-[#F3F6FF] to-white text-[13px] font-bold text-[#1E293B]">
        <span className="w-1 h-4 rounded-full bg-linear-to-b from-[#2F68FE] to-[#4F46E5]" aria-hidden />
        <span className="flex-1 min-w-0">{title}</span>
        {action}
      </h2>
      <div className="p-4">{children}</div>
    </section>
  ) : (
    <section className="bg-white rounded-[20px] p-4 ring-1 ring-[#ECEAFD] shadow-[0_6px_20px_-10px_rgba(108,92,231,0.28)]">
      <h2 className="flex items-center gap-2.5 text-sm font-bold text-[#1E293B]">
        <span className="w-2 h-2 rounded-full bg-[#6C5CE7] ring-4 ring-[#EEEBFD]" aria-hidden />
        <span className="flex-1 min-w-0">{title}</span>
        {action}
      </h2>
      <div className="mt-3.5 pt-3.5 border-t border-dashed border-[#E4E2FB]">{children}</div>
    </section>
  );

/** V1 = 2-column grid; V2 = label-left / value-right rows */
const Values: React.FC<{ v2: boolean; rows: ValueRow[] }> = ({ v2, rows }) =>
  v2 ? (
    <dl className="rounded-xl bg-[#F8FAFC] border border-slate-100 divide-y divide-slate-100 overflow-hidden">
      {rows.map((r) => (
        <div key={r.label} className="px-3 py-2.5 flex items-start justify-between gap-4">
          <dt className="pt-px text-[11.5px] font-medium text-slate-500 shrink-0">{r.label}</dt>
          <dd className={`min-w-0 text-right text-[13px] leading-snug break-words ${r.value ? 'font-semibold text-[#1E293B]' : 'italic text-slate-400'}`}>
            {r.value || 'Not added'}
          </dd>
        </div>
      ))}
    </dl>
  ) : (
    <dl className="grid grid-cols-2 gap-2.5">
      {rows.map((r) => (
        <div key={r.label} className={`min-w-0 rounded-xl bg-[#F7F6FE] px-3 py-2.5 ${r.wide ? 'col-span-2' : ''}`}>
          <dt className="text-[11px] font-medium text-slate-500">{r.label}</dt>
          <dd className={`mt-0.5 text-[13px] leading-snug break-words ${r.value ? 'font-semibold text-[#1E293B]' : 'italic text-slate-400'}`}>
            {r.value || 'Not added'}
          </dd>
        </div>
      ))}
    </dl>
  );

/* --------------------------------- Screen --------------------------------- */

/**
 * Company Profile (desktop Account → Company Profile). Desktop now opens MyCPE ONE's common company profile,
 * so B's sections, fields and validation are used; A adds Legal Agreements.
 * Edits sync the firm to MyCPE ONE (Part F #15).
 */
export const ClientCompanyProfileView: React.FC<{
  profile: ClientCompanyProfile;
  logoUrl: string | null;
  agreements: ClientAgreement[];
  onSave: (profile: ClientCompanyProfile) => void;
  onLogoChange: (url: string | null) => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}> = ({ profile, logoUrl, agreements, onSave, onLogoChange, onBack }) => {
  const perm = useClientPermission('company-profile');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClientCompanyProfile>(profile);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [logoSheet, setLogoSheet] = useState(false);
  const [notice, showNotice] = useNotice();
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  const inputClass = v2 ? inputClassV2 : fieldInputClass;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(profile);

  const set = <K extends keyof ClientCompanyProfile>(key: K, value: ClientCompanyProfile[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const startEdit = () => {
    setDraft(profile);
    setErrors({});
    setEditing(true);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stopEdit = () => {
    setEditing(false);
    setErrors({});
    setDraft(profile);
  };

  const save = () => {
    const found = validate(draft);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      scrollRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      onSave({
        ...draft,
        companyName: draft.companyName.trim(),
        address1: draft.address1.trim(),
        address2: draft.address2.trim(),
        lastSyncedAt: new Date().toISOString(),
      });
      setSaving(false);
      setEditing(false);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      showNotice('Company profile updated and synced to MyCPE ONE.');
    }, 700);
  };

  const v = editing ? draft : profile;
  const states = statesOf(v.country);
  const cities = citiesOf(v.country, v.state);

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* While editing the back arrow works like Cancel */}
      <ScreenHeader
        title={editing ? 'Edit Company Details' : 'Company Profile'}
        onBack={editing ? () => (dirty ? setConfirmDiscard(true) : stopEdit()) : onBack}
        backLabel={editing ? 'Cancel editing' : undefined}
        version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }}
      />
      {notice && <div className="absolute top-3 inset-x-4 z-20 pointer-events-none">{notice}</div>}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {loading ? (
          <ProfileSkeleton label="Loading company profile" />
        ) : (
          <div className="relative px-4 pt-4 space-y-3 animate-in fade-in duration-200">
            {editing ? (
              <>
                <Section v2={v2} title="Company Details">
                  <div className="space-y-4">
                    <label className="block space-y-1.5" data-field="companyName">
                      <Label text="Company Name" required />
                      <input
                        type="text"
                        autoComplete="organization"
                        value={draft.companyName}
                        onChange={(e) => set('companyName', e.target.value.slice(0, COMPANY_LIMITS.companyName))}
                        aria-invalid={Boolean(errors.companyName)}
                        className={inputClass(errors.companyName)}
                      />
                      <ErrorText error={errors.companyName} />
                    </label>
                    <div className="space-y-1.5" data-field="businessType">
                      <Label text="Business Type" required />
                      <Dropdown
                        ariaLabel="Business Type"
                        value={draft.businessType || null}
                        placeholder="Select business type"
                        options={BUSINESS_TYPES}
                        onChange={(b) => set('businessType', b)}
                      />
                      <ErrorText error={errors.businessType} />
                    </div>
                    <LockedField label="Company Email" required value={profile.email} />
                    <div className="space-y-1.5" data-field="industries">
                      <MultiSelectDropdown
                        label="Industry *"
                        placeholder="Select industries"
                        options={INDUSTRY_OPTIONS.map((o) => ({ value: o, label: o }))}
                        selected={draft.industries}
                        onChange={(next) => set('industries', next)}
                        searchable
                      />
                      <RemovableTags items={draft.industries} onRemove={(t) => set('industries', draft.industries.filter((x) => x !== t))} />
                      <ErrorText error={errors.industries} />
                    </div>
                    <label className="block space-y-1.5">
                      <Label text="Fax" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={draft.fax}
                        onChange={(e) => set('fax', digitsOnly(e.target.value, COMPANY_LIMITS.fax))}
                        placeholder="Fax number"
                        className={`${inputClass()} tabular-nums`}
                      />
                    </label>
                    <div className="grid grid-cols-[1fr_92px] gap-3">
                      <label className="block space-y-1.5 min-w-0" data-field="phone">
                        <Label text="Company Phone" required />
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          value={draft.phone}
                          onChange={(e) => set('phone', formatCompanyPhone(e.target.value))}
                          placeholder="(999) 999-9999"
                          aria-invalid={Boolean(errors.phone)}
                          className={`${inputClass(errors.phone)} tabular-nums`}
                        />
                      </label>
                      <label className="block space-y-1.5 min-w-0">
                        <Label text="Ext" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={draft.ext}
                          onChange={(e) => set('ext', digitsOnly(e.target.value, COMPANY_LIMITS.ext))}
                          placeholder="ext"
                          className={`${inputClass()} tabular-nums`}
                        />
                      </label>
                    </div>
                    {errors.phone && <div className="-mt-2.5"><ErrorText error={errors.phone} /></div>}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <Label text="No. of Employees" />
                        <Dropdown
                          ariaLabel="No. of Employees"
                          value={draft.employees || null}
                          placeholder="Select"
                          options={EMPLOYEE_SIZES}
                          onChange={(s) => set('employees', s)}
                        />
                      </div>
                      <label className="block space-y-1.5 min-w-0">
                        <Label text="No. of Onshore Staff" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={draft.onshoreStaff}
                          onChange={(e) => set('onshoreStaff', digitsOnly(e.target.value, COMPANY_LIMITS.onshoreStaff))}
                          placeholder="e.g. 12"
                          className={`${inputClass()} tabular-nums`}
                        />
                      </label>
                    </div>
                    <div className="space-y-1.5" data-field="timeZone">
                      <Label text="Time Zone" required />
                      <Dropdown
                        ariaLabel="Time Zone"
                        value={draft.timeZone || null}
                        placeholder="Select time zone"
                        options={CLIENT_TIME_ZONES.map((t) => ({ value: t.value, label: t.label, description: t.value }))}
                        onChange={(t) => set('timeZone', t)}
                      />
                      <ErrorText error={errors.timeZone} />
                    </div>
                  </div>
                </Section>

                <Section v2={v2} title="Address Information">
                  <div className="space-y-4">
                    <label className="block space-y-1.5" data-field="address1">
                      <Label text="Address 1" required />
                      <input
                        type="text"
                        autoComplete="address-line1"
                        value={draft.address1}
                        onChange={(e) => set('address1', e.target.value.slice(0, COMPANY_LIMITS.address))}
                        placeholder="Street and number"
                        aria-invalid={Boolean(errors.address1)}
                        className={inputClass(errors.address1)}
                      />
                      <ErrorText error={errors.address1} />
                    </label>
                    <label className="block space-y-1.5">
                      <Label text="Address 2" />
                      <input
                        type="text"
                        autoComplete="address-line2"
                        value={draft.address2}
                        onChange={(e) => set('address2', e.target.value.slice(0, COMPANY_LIMITS.address))}
                        placeholder="Suite, floor, building (optional)"
                        className={inputClass()}
                      />
                    </label>
                    <div className="space-y-1.5" data-field="country">
                      <Label text="Country" required />
                      <Dropdown
                        ariaLabel="Country"
                        value={draft.country || null}
                        placeholder="Select country"
                        options={CLIENT_COUNTRIES}
                        onChange={(c) => {
                          if (c === draft.country) return;
                          setDraft((d) => ({ ...d, country: c, state: '', city: '' }));
                          setErrors((e) => ({ ...e, country: '' }));
                        }}
                      />
                      <ErrorText error={errors.country} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 min-w-0" data-field="state">
                        <Label text="State" required />
                        {states.length ? (
                          <Dropdown
                            ariaLabel="State"
                            value={draft.state || null}
                            placeholder="Select"
                            options={states}
                            menuMinWidth={220}
                            onChange={(s) => {
                              if (s === draft.state) return;
                              setDraft((d) => ({ ...d, state: s, city: '' }));
                              setErrors((e) => ({ ...e, state: '' }));
                            }}
                          />
                        ) : (
                          <DisabledSelect text="Pick country" />
                        )}
                        <ErrorText error={errors.state} />
                      </div>
                      <div className="space-y-1.5 min-w-0" data-field="city">
                        <Label text="City" required />
                        {cities.length ? (
                          <Dropdown
                            ariaLabel="City"
                            value={draft.city || null}
                            placeholder="Select"
                            options={cities}
                            menuMinWidth={200}
                            onChange={(c) => set('city', c)}
                          />
                        ) : (
                          <DisabledSelect text="Pick state" />
                        )}
                        <ErrorText error={errors.city} />
                      </div>
                    </div>
                    <label className="block space-y-1.5" data-field="zipCode">
                      <Label text="Zip Code" required />
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        value={draft.zipCode}
                        onChange={(e) => set('zipCode', digitsOnly(e.target.value, COMPANY_LIMITS.zip))}
                        placeholder="e.g. 02109"
                        aria-invalid={Boolean(errors.zipCode)}
                        className={`${inputClass(errors.zipCode)} tabular-nums`}
                      />
                      <ErrorText error={errors.zipCode} />
                    </label>
                  </div>
                </Section>

                <Section v2={v2} title="Online Presence">
                  <div className="space-y-4">
                    {(
                      [
                        { key: 'website', label: 'Website', max: COMPANY_LIMITS.website, placeholder: 'https://www.yourfirm.com' },
                        { key: 'linkedin', label: 'LinkedIn', max: COMPANY_LIMITS.social, placeholder: 'https://www.linkedin.com/company/…' },
                        { key: 'twitter', label: 'Twitter', max: COMPANY_LIMITS.social, placeholder: 'https://x.com/…' },
                        { key: 'facebook', label: 'Facebook', max: COMPANY_LIMITS.social, placeholder: 'https://www.facebook.com/…' },
                      ] as const
                    ).map((f) => (
                      <label key={f.key} className="block space-y-1.5" data-field={f.key}>
                        <Label text={f.label} />
                        <input
                          type="url"
                          inputMode="url"
                          autoCapitalize="none"
                          spellCheck={false}
                          value={draft[f.key]}
                          onChange={(e) => set(f.key, e.target.value.trim().slice(0, f.max))}
                          placeholder={f.placeholder}
                          aria-invalid={Boolean(errors[f.key])}
                          className={inputClass(errors[f.key])}
                        />
                        <ErrorText error={errors[f.key]} />
                      </label>
                    ))}
                  </div>
                </Section>

                <Section v2={v2} title="Services Provided">
                  <div className="space-y-1.5">
                    <MultiSelectDropdown
                      label="Services"
                      placeholder="Select services"
                      options={SERVICE_OPTIONS.map((o) => ({ value: o, label: o }))}
                      selected={draft.services}
                      onChange={(next) => set('services', next)}
                      searchable
                    />
                    <RemovableTags items={draft.services} onRemove={(t) => set('services', draft.services.filter((x) => x !== t))} />
                  </div>
                </Section>
              </>
            ) : (
              <>
                {v2 ? (
                  <section className="relative mt-1 overflow-hidden rounded-2xl px-4 py-4 bg-linear-to-br from-[#2F68FE] to-[#4F46E5] text-white shadow-[0_10px_24px_-12px_rgba(47,104,254,0.7)]">
                    <span className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/10" aria-hidden />
                    <span className="absolute right-16 -bottom-12 w-24 h-24 rounded-full bg-white/5" aria-hidden />
                    <div className="relative flex items-center gap-3">
                      <div className="relative shrink-0">
                        <span className="w-14 h-14 rounded-xl bg-white/15 ring-1 ring-white/30 flex items-center justify-center overflow-hidden">
                          {logoUrl ? (
                            <img src={logoUrl} alt={`${profile.companyName} logo`} className="w-full h-full object-contain p-1.5 bg-white" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-white/70" aria-hidden />
                          )}
                        </span>
                        {perm.edit && (
                          <button
                            type="button"
                            onClick={() => setLogoSheet(true)}
                            className="absolute -right-4 -bottom-4 w-11 h-11 flex items-center justify-center cursor-pointer group"
                            aria-label={logoUrl ? 'Change company logo' : 'Add company logo'}
                          >
                            <span className="w-6 h-6 rounded-md bg-white text-[#2F68FE] shadow-sm flex items-center justify-center group-active:bg-blue-50">
                              <Pencil className="w-3 h-3" />
                            </span>
                          </button>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/70">Company Profile</p>
                        <h2 className="mt-0.5 text-base font-bold leading-tight truncate">{profile.companyName}</h2>
                      </div>
                      {perm.edit && (
                        <button
                          type="button"
                          onClick={startEdit}
                          className="h-9 px-3 rounded-lg bg-white text-[#2F68FE] text-xs font-bold shrink-0 active:bg-blue-50 transition-colors cursor-pointer"
                        >
                          Update Profile
                        </button>
                      )}
                    </div>
                  </section>
                ) : (
                  <section className="bg-[#E4E2FB] rounded-2xl p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <span className="w-16 h-16 rounded-full bg-[#EEF0F4] border-2 border-white flex items-center justify-center overflow-hidden">
                          {logoUrl ? (
                            <img src={logoUrl} alt={`${profile.companyName} logo`} className="w-full h-full object-contain p-1.5 bg-white" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-400" aria-hidden />
                          )}
                        </span>
                        {perm.edit && (
                          <button
                            type="button"
                            onClick={() => setLogoSheet(true)}
                            className="absolute -right-3 -top-3 w-11 h-11 flex items-center justify-center cursor-pointer group"
                            aria-label={logoUrl ? 'Change company logo' : 'Add company logo'}
                          >
                            <span className="w-7 h-7 rounded-full bg-white text-[#1E293B] shadow-sm flex items-center justify-center group-active:bg-slate-100">
                              <Pencil className="w-3.5 h-3.5" />
                            </span>
                          </button>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-600">Company Profile</p>
                        <h2 className="mt-0.5 text-lg font-bold text-[#1E293B] leading-tight truncate">{profile.companyName}</h2>
                      </div>
                    </div>
                    {perm.edit && (
                      <button
                        type="button"
                        onClick={startEdit}
                        className="mt-4 w-full h-11 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold flex items-center justify-center active:bg-[#5A4BD1] transition-colors cursor-pointer"
                      >
                        Update Profile
                      </button>
                    )}
                  </section>
                )}

                <Section v2={v2} title="Company Master Profile">
                  <Values v2={v2}
                    rows={[
                      { label: 'Business Type', value: businessTypeLabel(profile.businessType), wide: true },
                      { label: 'Email', value: profile.email, wide: true },
                      { label: 'Industry', value: profile.industries.join(', '), wide: true },
                      { label: 'Phone Number', value: profile.phone },
                      { label: 'Ext', value: profile.ext },
                      { label: 'Fax', value: profile.fax },
                      { label: 'Time Zone', value: profile.timeZone ? timeZoneLabel(profile.timeZone) : '' },
                      { label: 'No. of Employees', value: profile.employees },
                      { label: 'No. of Onshore Staff', value: profile.onshoreStaff },
                    ]}
                  />
                </Section>

                <Section v2={v2} title="Address">
                  <Values v2={v2}
                    rows={[
                      { label: 'Address 1', value: profile.address1, wide: true },
                      { label: 'Address 2', value: profile.address2, wide: true },
                      { label: 'Country', value: profile.country },
                      { label: 'State', value: profile.state },
                      { label: 'City', value: profile.city },
                      { label: 'Zip Code', value: profile.zipCode },
                    ]}
                  />
                </Section>

                <Section v2={v2} title="Online Presence">
                  <Values v2={v2}
                    rows={[
                      { label: 'Website', value: shortUrl(profile.website), wide: true },
                      { label: 'LinkedIn', value: shortUrl(profile.linkedin), wide: true },
                      { label: 'X', value: shortUrl(profile.twitter), wide: true },
                      { label: 'Facebook', value: shortUrl(profile.facebook), wide: true },
                    ]}
                  />
                </Section>

                <Section v2={v2} title="Services Provided">
                  <Values v2={v2} rows={[{ label: 'Services', value: profile.services.join(', '), wide: true }]} />
                </Section>

                {agreements.length > 0 && (
                  <Section v2={v2} title="Legal Agreements">
                    <ul className="space-y-2">
                      {agreements.map((a) => (
                        <li
                          key={a.id}
                          className={
                            v2
                              ? 'min-h-14 pl-2.5 pr-1 py-1.5 flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F8FAFC]'
                              : 'min-h-14 pl-2.5 pr-1 py-1.5 flex items-center gap-3 rounded-xl bg-[#F7F6FE]'
                          }
                        >
                          <span
                            className={`w-9 h-9 flex items-center justify-center shrink-0 ${
                              v2 ? 'rounded-lg bg-white border border-slate-200 text-[#2F68FE]' : 'rounded-full bg-white text-[#6C5CE7] shadow-xs'
                            }`}
                          >
                            <FileText className="w-4.5 h-4.5" />
                          </span>
                          <span className={`flex-1 min-w-0 text-[13px] text-[#1E293B] leading-snug break-words ${v2 ? 'font-semibold' : 'font-medium'}`}>
                            {a.fileName}
                          </span>
                          {perm.download && (
                            <button
                              type="button"
                              onClick={() => showNotice(`Downloading ${a.fileName}`)}
                              aria-label={`Download ${a.fileName}`}
                              className={`w-11 h-11 flex items-center justify-center cursor-pointer shrink-0 ${
                                v2 ? 'rounded-lg text-[#2F68FE] active:bg-blue-50' : 'rounded-full text-[#6C5CE7] active:bg-[#EEEBFD]'
                              }`}
                            >
                              <Download className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer (edit only): Cancel / Save. Update Profile lives in the header banner, like desktop */}
      {!loading && editing && (
        <div
          className={`shrink-0 bg-white border-t ${
            v2 ? 'px-4 py-3 border-slate-200' : 'p-4 pb-5 bg-white/95 backdrop-blur-md border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className={`grid gap-2.5 ${v2 ? 'grid-cols-2' : 'grid-cols-[1fr_2fr]'}`}>
            <button
              type="button"
              onClick={() => (dirty ? setConfirmDiscard(true) : stopEdit())}
              className={`border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer ${
                v2 ? 'h-11 rounded-lg' : 'h-12 rounded-xl'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className={`bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                v2 ? 'h-11 rounded-lg' : 'h-12 rounded-xl'
              }`}
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <CompanyLogoSheet
        isOpen={logoSheet}
        logoUrl={logoUrl}
        onClose={() => setLogoSheet(false)}
        onSave={(url) => {
          setLogoSheet(false);
          onLogoChange(url);
          showNotice(url ? 'Company logo saved.' : 'Company logo removed.');
        }}
      />
      <ConfirmSheet
        isOpen={confirmDiscard}
        title="Discard your changes?"
        message="Your edits to the company profile haven't been saved."
        confirmLabel="Discard"
        danger
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          stopEdit();
        }}
      />
    </div>
  );
};
