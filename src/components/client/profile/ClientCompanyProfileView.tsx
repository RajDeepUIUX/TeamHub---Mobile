import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Camera, Check, ChevronRight, Download, FileText, Info, Mail, MapPin, Pencil, RefreshCw } from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { ConfirmSheet, Pill, ScreenHeader, fieldInputClass, useNotice } from '../staff/tabs/StaffTabParts';
import { useClientPermission } from '../context/ClientPermissionContext';
import { CompanyLogoSheet } from './CompanyLogoSheet';
import {
  BandSectionCard as SectionCard,
  DisabledSelect,
  ErrorText,
  Label,
  LockedField,
  ProfileSkeleton,
  RemovableTags,
  ValueGrid,
} from './ProfileParts';
import { CLIENT_COUNTRIES, CLIENT_TIME_ZONES, citiesOf, statesOf, timeZoneLabel } from '../data/clientUserProfileData';
import {
  BUSINESS_TYPES,
  COMPANY_LIMITS,
  ClientAgreement,
  ClientCompanyProfile,
  ClientFirmContact,
  EMPLOYEE_SIZES,
  INDUSTRY_OPTIONS,
  SERVICE_OPTIONS,
  businessTypeLabel,
  formatCompanyPhone,
  isValidUrl,
  shortUrl,
} from '../data/clientCompanyProfileData';

const LOAD_MS = 600;
const CONTACTS_PREVIEW = 3;

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

const formatSynced = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

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

const TagList: React.FC<{ items: string[]; empty: string }> = ({ items, empty }) =>
  items.length ? (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8]">
          {t}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-[13px] italic text-slate-400">{empty}</p>
  );

/* --------------------------------- Screen --------------------------------- */

/**
 * Company Profile (desktop Account → Company Profile). Desktop now opens MyCPE ONE's common company profile,
 * so B's sections, fields and validation are used; A adds Legal Agreements and the Contact Person list.
 * Edits sync the firm to MyCPE ONE (Part F #15).
 */
export const ClientCompanyProfileView: React.FC<{
  profile: ClientCompanyProfile;
  logoUrl: string | null;
  agreements: ClientAgreement[];
  contacts: ClientFirmContact[];
  onSave: (profile: ClientCompanyProfile) => void;
  onLogoChange: (url: string | null) => void;
  /** Client Contacts module; omitted when the role can't open it */
  onOpenContacts?: () => void;
  onContactManager: () => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}> = ({ profile, logoUrl, agreements, contacts, onSave, onLogoChange, onOpenContacts, onContactManager, onBack }) => {
  const perm = useClientPermission('company-profile');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClientCompanyProfile>(profile);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [logoSheet, setLogoSheet] = useState(false);
  const [notice, showNotice] = useNotice();
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
      />
      {notice && <div className="absolute top-3 inset-x-4 z-20 pointer-events-none">{notice}</div>}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {loading ? (
          <ProfileSkeleton label="Loading company profile" />
        ) : (
          <div className="relative px-4 pt-4 space-y-3 animate-in fade-in duration-200">
            {editing ? (
              <>
                <div className="flex items-center gap-2">
                  <p className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/80 text-[11px] text-slate-500">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Fields marked * are required.
                  </p>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10.5px] font-bold flex items-center gap-1 shrink-0">
                    <Pencil className="w-3 h-3" />
                    Editing
                  </span>
                </div>

                <SectionCard title="Company Details">
                  <div className="space-y-4">
                    <label className="block space-y-1.5" data-field="companyName">
                      <Label text="Company Name" required hint={`${draft.companyName.length}/${COMPANY_LIMITS.companyName}`} />
                      <input
                        type="text"
                        autoComplete="organization"
                        value={draft.companyName}
                        onChange={(e) => set('companyName', e.target.value.slice(0, COMPANY_LIMITS.companyName))}
                        aria-invalid={Boolean(errors.companyName)}
                        className={fieldInputClass(errors.companyName)}
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
                    <LockedField label="Company Email" value={profile.email} note="Your firm's MyCPE ONE account email. Contact your Account Manager to change it." />
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
                        className={`${fieldInputClass()} tabular-nums`}
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
                          className={`${fieldInputClass(errors.phone)} tabular-nums`}
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
                          className={`${fieldInputClass()} tabular-nums`}
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
                        <Label text="Onshore Staff" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={draft.onshoreStaff}
                          onChange={(e) => set('onshoreStaff', digitsOnly(e.target.value, COMPANY_LIMITS.onshoreStaff))}
                          placeholder="e.g. 12"
                          className={`${fieldInputClass()} tabular-nums`}
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
                </SectionCard>

                <SectionCard title="Address Information">
                  <div className="space-y-4">
                    <label className="block space-y-1.5" data-field="address1">
                      <Label text="Address 1" required hint={`${draft.address1.length}/${COMPANY_LIMITS.address}`} />
                      <input
                        type="text"
                        autoComplete="address-line1"
                        value={draft.address1}
                        onChange={(e) => set('address1', e.target.value.slice(0, COMPANY_LIMITS.address))}
                        placeholder="Street and number"
                        aria-invalid={Boolean(errors.address1)}
                        className={fieldInputClass(errors.address1)}
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
                        className={fieldInputClass()}
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
                        className={`${fieldInputClass(errors.zipCode)} tabular-nums`}
                      />
                      <ErrorText error={errors.zipCode} />
                    </label>
                  </div>
                </SectionCard>

                <SectionCard title="Online Presence">
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
                          className={fieldInputClass(errors[f.key])}
                        />
                        <ErrorText error={errors[f.key]} />
                      </label>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Services Provided">
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
                </SectionCard>
              </>
            ) : (
              <>
                {/* Gradient band behind the top of the company card */}
                <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-br from-[#4F6BFA] via-[#5B5EF5] to-[#8B5CF6]" aria-hidden="true" />
                <section className="relative bg-white rounded-3xl p-4 shadow-[0_12px_32px_-16px_rgba(79,70,229,0.35)] border border-white">
                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <span className="block w-16 h-16 rounded-2xl bg-linear-to-br from-amber-200 via-rose-200 to-violet-300 p-0.5">
                        <span className="w-full h-full rounded-[14px] bg-linear-to-br from-[#FFF7ED] to-[#FDF2F8] flex items-center justify-center overflow-hidden">
                          {logoUrl ? (
                            <img src={logoUrl} alt={`${profile.companyName} logo`} className="w-full h-full object-contain p-1.5 bg-white" />
                          ) : (
                            <span className="text-lg font-bold text-[#9A3412]" aria-hidden>
                              {initialsOf(profile.companyName)}
                            </span>
                          )}
                        </span>
                      </span>
                      {perm.edit && (
                        <button
                          type="button"
                          onClick={() => setLogoSheet(true)}
                          className="absolute -right-4 -bottom-4 w-11 h-11 flex items-center justify-center cursor-pointer group"
                          aria-label={logoUrl ? 'Change company logo' : 'Add company logo'}
                        >
                          <span className="w-6 h-6 rounded-full bg-[#2F68FE] text-white ring-[3px] ring-white flex items-center justify-center shadow-xs group-active:bg-[#1D4ED8]">
                            <Camera className="w-3 h-3" />
                          </span>
                        </button>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-lg font-extrabold text-[#1E293B] leading-tight truncate">{profile.companyName}</h2>
                        <BadgeCheck className="w-4.5 h-4.5 text-[#2F68FE] shrink-0" aria-label="Verified" />
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{profile.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50/80 border border-slate-100 overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-slate-200/70">
                      {[
                        { label: 'Business Type', value: businessTypeLabel(profile.businessType) },
                        { label: 'Phone', value: profile.phone },
                      ].map(({ label, value }) => (
                        <div key={label} className="px-3 py-2.5 min-w-0">
                          <span className="block text-[11px] font-semibold text-slate-400">{label}</span>
                          <span className="block text-[13px] font-bold text-[#1E293B] truncate mt-0.5 tabular-nums">{value || '—'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2.5 border-t border-slate-200/70 flex items-center gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[11px] font-semibold text-slate-400">Location</span>
                        <span className="block text-[13px] font-bold text-[#1E293B] truncate">
                          {[profile.city, profile.state, profile.country].filter(Boolean).join(', ') || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {perm.edit ? (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="mt-3 w-full h-11 rounded-xl bg-[#4F46E5] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#4338CA] transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      Update Profile
                    </button>
                  ) : (
                    <p className="mt-3 flex items-center gap-2 text-[11.5px] font-medium text-slate-500">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      View only — your role can't change company details
                    </p>
                  )}
                </section>

                <SectionCard title="Company Master Profile">
                  <ValueGrid
                    rows={[
                      { label: 'Business Type', value: businessTypeLabel(profile.businessType), wide: true },
                      { label: 'Email', value: profile.email, wide: true, locked: true, href: `mailto:${profile.email}` },
                      { label: 'Industry', value: profile.industries.join(', '), wide: true },
                      {
                        label: 'Phone Number',
                        value: profile.phone,
                        href: profile.phone ? `tel:${profile.phone.replace(/\D/g, '')}` : undefined,
                      },
                      { label: 'Ext', value: profile.ext },
                      { label: 'Fax', value: profile.fax },
                      { label: 'Time Zone', value: profile.timeZone ? timeZoneLabel(profile.timeZone) : '' },
                      { label: 'No. of Employees', value: profile.employees },
                      { label: 'No. of Onshore Staff', value: profile.onshoreStaff },
                    ]}
                  />
                </SectionCard>

                <SectionCard title="Address">
                  <ValueGrid
                    rows={[
                      { label: 'Address 1', value: profile.address1, wide: true },
                      { label: 'Address 2', value: profile.address2, wide: true },
                      { label: 'Country', value: profile.country },
                      { label: 'State', value: profile.state },
                      { label: 'City', value: profile.city },
                      { label: 'Zip Code', value: profile.zipCode },
                    ]}
                  />
                </SectionCard>

                <SectionCard title="Online Presence">
                  <ValueGrid
                    rows={[
                      { label: 'Website', value: shortUrl(profile.website), href: profile.website || undefined, wide: true },
                      { label: 'LinkedIn', value: shortUrl(profile.linkedin), href: profile.linkedin || undefined, wide: true },
                      { label: 'X', value: shortUrl(profile.twitter), href: profile.twitter || undefined, wide: true },
                      { label: 'Facebook', value: shortUrl(profile.facebook), href: profile.facebook || undefined, wide: true },
                    ]}
                  />
                </SectionCard>

                <SectionCard title="Services Provided">
                  <p className="mb-1.5 text-[11px] text-slate-400">Services</p>
                  <TagList items={profile.services} empty="Not added" />
                </SectionCard>

                {agreements.length > 0 && (
                  <SectionCard title="Legal Agreements" action={<span className="text-[11px] font-semibold text-slate-400">{agreements.length} files</span>}>
                    <ul className="-mx-1 -my-1 divide-y divide-slate-100">
                      {agreements.map((a) => (
                        <li key={a.id} className="min-h-14 px-1 py-2 flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                            <FileText className="w-4.5 h-4.5" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] font-semibold text-[#1E293B] leading-snug break-words">{a.fileName}</span>
                            <span className="block text-[11px] text-slate-400">PDF</span>
                          </span>
                          {perm.download && (
                            <button
                              type="button"
                              onClick={() => showNotice(`Downloading ${a.fileName}`)}
                              aria-label={`Download ${a.fileName}`}
                              className="w-11 h-11 -mr-1 rounded-xl text-slate-500 flex items-center justify-center active:bg-slate-100 cursor-pointer shrink-0"
                            >
                              <Download className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}

                <SectionCard
                  title="Contact Persons"
                  action={
                    onOpenContacts && (
                      <button
                        type="button"
                        onClick={onOpenContacts}
                        className="h-8 -mr-1.5 px-2 rounded-lg text-[11px] font-bold text-[#2F68FE] flex items-center gap-0.5 active:bg-[#EFF6FF] cursor-pointer"
                      >
                        Manage
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )
                  }
                >
                  <ul className="-mx-1 -my-1 divide-y divide-slate-100">
                    {contacts.slice(0, CONTACTS_PREVIEW).map((c, i) => (
                      <li key={c.id} className="min-h-14 px-1 py-2 flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarTint(i)}`}
                          aria-hidden
                        >
                          {initialsOf(c.name)}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[13px] font-semibold text-[#1E293B] truncate">{c.name}</span>
                            {c.isPrimary && <Pill tone="green">Primary</Pill>}
                          </span>
                          <span className="block text-[11px] text-slate-400 break-all">{c.email}</span>
                        </span>
                        <Pill tone={c.isAdmin ? 'indigo' : 'slate'}>{c.role || 'Manager'}</Pill>
                      </li>
                    ))}
                  </ul>
                  {contacts.length > CONTACTS_PREVIEW && (
                    <p className="mt-2.5 text-[11px] text-slate-400">
                      +{contacts.length - CONTACTS_PREVIEW} more {contacts.length - CONTACTS_PREVIEW === 1 ? 'contact' : 'contacts'}
                    </p>
                  )}
                </SectionCard>

                <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white border border-[#DCE3ED]">
                  <span className="w-9 h-9 rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0">
                    <RefreshCw className="w-4.5 h-4.5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-[#1E293B]">Synced with MyCPE ONE</span>
                    <span className="block text-[11px] text-slate-400 truncate">Last synced {formatSynced(profile.lastSyncedAt)}</span>
                  </span>
                </div>

                <p className="px-1 text-[11px] text-slate-400 leading-relaxed">
                  Need to change the company email?{' '}
                  <button type="button" onClick={onContactManager} className="font-bold text-[#2F68FE] cursor-pointer">
                    Contact your Account Manager
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer (edit only): Cancel / Save. Update Profile lives in the header banner, like desktop */}
      {!loading && editing && (
        <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            <button
              type="button"
              onClick={() => (dirty ? setConfirmDiscard(true) : stopEdit())}
              className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
