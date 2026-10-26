import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Camera,
  Check,
  Clock,
  Download,
  Factory,
  FileText,
  Flag,
  Globe,
  Hash,
  Image as ImageIcon,
  Info,
  Landmark,
  Link2,
  Mail,
  MapPin,
  Phone,
  Printer,
  UserCheck,
  Users,
} from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { ConfirmSheet, ScreenHeader, fieldInputClass, useNotice } from '../staff/tabs/StaffTabParts';
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

type ValueRow = { label: string; value: string; wide?: boolean; icon?: React.ElementType };

/** White card with its title over a hairline, like My Profile. `flush` = body without padding (for divided lists) */
const Section: React.FC<{ title: string; action?: React.ReactNode; flush?: boolean; children: React.ReactNode }> = ({
  title,
  action,
  flush,
  children,
}) => (
  <section className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
    <div className={`mx-4 pt-4 pb-2.5 min-h-8 flex items-center justify-between gap-2 border-b border-slate-100 ${flush ? '' : 'mb-3.5'}`}>
      <h2 className="flex-1 min-w-0 text-[13px] font-bold text-[#1E293B] leading-snug">{title}</h2>
      {action}
    </div>
    <div className={flush ? '' : 'px-4 pb-4'}>{children}</div>
  </section>
);

/** Menu-style row: tinted icon tile + value over label, divider inset after the tile */
const ProfileRow: React.FC<{ icon: React.ElementType; tint: string; last?: boolean; children: React.ReactNode; trailing?: React.ReactNode }> = ({
  icon: Icon,
  tint,
  last,
  children,
  trailing,
}) => (
  <div className="flex items-center gap-3 pl-3.5">
    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
      <Icon className="w-4.5 h-4.5" />
    </span>
    <div className={`flex-1 min-w-0 flex items-center gap-2 py-3 pr-3.5 ${last ? '' : 'border-b border-slate-100'}`}>
      <div className="flex-1 min-w-0">{children}</div>
      {trailing}
    </div>
  </div>
);

/** Menu-style icon rows */
const Values: React.FC<{ rows: ValueRow[]; tint?: string }> = ({ rows, tint = 'bg-blue-50 text-blue-600' }) => (
  <dl>
    {rows.map((r, i) => (
      <ProfileRow key={r.label} icon={r.icon ?? Building2} tint={tint} last={i === rows.length - 1}>
        <div className="flex flex-col-reverse">
          <dt className="text-[11px] text-slate-400">{r.label}</dt>
          <dd className={`text-[13px] leading-snug break-words tabular-nums ${r.value ? 'font-semibold text-[#1E293B]' : 'italic text-slate-400'}`}>
            {r.value || 'Not added'}
          </dd>
        </div>
      </ProfileRow>
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
  const inputClass = fieldInputClass;
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

  /** V1 view mode: gradient hero (header lives inside it) with the profile card overlapping, like Manager My Profile */
  const heroV1 = !editing;

  return (
    <div className={`relative flex-1 flex flex-col text-[#1E293B] overflow-hidden select-none ${heroV1 ? 'bg-[#F5F7FB]' : 'bg-[#F8FAFC]'}`}>
      {/* While editing the back arrow works like Cancel */}
      {!heroV1 && (
        <ScreenHeader
          title={editing ? 'Edit Company Details' : 'Company Profile'}
          onBack={editing ? () => (dirty ? setConfirmDiscard(true) : stopEdit()) : onBack}
          backLabel={editing ? 'Cancel editing' : undefined}
        />
      )}
      {notice && <div className="absolute top-3 inset-x-4 z-20 pointer-events-none">{notice}</div>}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {heroV1 && (
          <div className="relative bg-linear-to-br from-[#4F6BFA] via-[#5B5EF5] to-[#8B5CF6] pb-16">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute top-16 -left-12 w-36 h-36 rounded-full bg-cyan-300/20 blur-2xl" aria-hidden="true" />
            <header className="relative flex items-center px-4 h-14">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Back to Dashboard"
                  className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm text-white flex items-center justify-center active:bg-white/25 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-96px)] flex items-center gap-2">
                <h1 className="min-w-0 text-base font-bold text-white truncate">Company Profile</h1>
              </div>
            </header>
          </div>
        )}
        {loading ? (
          <ProfileSkeleton label="Loading company profile" />
        ) : (
          <div className={`relative px-4 animate-in fade-in duration-200 ${heroV1 ? '-mt-12 pb-2 space-y-3.5' : 'pt-4 space-y-3'}`}>
            {editing ? (
              <>
                <h1 className="text-base font-bold leading-tight">Edit Company Details</h1>
                <p className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-[#2F68FE]">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Fields marked * are required.
                </p>

                <Section title="Company Details">
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

                <Section title="Address Information">
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

                <Section title="Online Presence">
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

                <Section title="Services Provided">
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
                <section className="bg-white rounded-2xl p-4 shadow-[0_8px_24px_-16px_rgba(79,70,229,0.35)] border border-slate-100">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const avatar = (
                        <>
                          <span className="w-13 h-13 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                            {logoUrl ? (
                              <img src={logoUrl} alt={`${profile.companyName} logo`} className="w-full h-full object-contain p-1" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-400" aria-hidden />
                            )}
                          </span>
                          {perm.edit && (
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#2F68FE] text-white ring-2 ring-white flex items-center justify-center">
                              <Camera className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </>
                      );
                      return perm.edit ? (
                        <button
                          type="button"
                          onClick={() => setLogoSheet(true)}
                          className="relative shrink-0 flex cursor-pointer"
                          aria-label={logoUrl ? 'Change company logo' : 'Add company logo'}
                        >
                          {avatar}
                        </button>
                      ) : (
                        <div className="relative shrink-0 flex">{avatar}</div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Company Profile</p>
                      <h2 className="text-base font-bold text-[#1E293B] leading-tight truncate">{profile.companyName}</h2>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{profile.email}</span>
                      </p>
                    </div>
                  </div>

                  <dl className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-3 gap-y-2.5">
                    {[
                      { label: 'Business Type', value: businessTypeLabel(profile.businessType) },
                      { label: 'Phone Number', value: profile.phone },
                      { label: 'City', value: profile.city },
                    ].map(({ label, value }) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                        <dd className="text-xs font-semibold text-[#1E293B] truncate tabular-nums">{value || 'Not added'}</dd>
                      </div>
                    ))}
                  </dl>

                  {perm.edit && (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="mt-3.5 w-full h-10 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center active:bg-[#1D4ED8] transition-colors cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  )}
                </section>

                <Section flush title="Company Master Profile">
                  <Values
                    tint="bg-blue-50 text-blue-600"
                    rows={[
                      { label: 'Business Type', value: businessTypeLabel(profile.businessType), wide: true, icon: Briefcase },
                      { label: 'Email', value: profile.email, wide: true, icon: Mail },
                      { label: 'Industry', value: profile.industries.join(', '), wide: true, icon: Factory },
                      { label: 'Phone Number', value: profile.phone, icon: Phone },
                      { label: 'Ext', value: profile.ext, icon: Hash },
                      { label: 'Fax', value: profile.fax, icon: Printer },
                      { label: 'Time Zone', value: profile.timeZone ? timeZoneLabel(profile.timeZone) : '', icon: Clock },
                      { label: 'No. of Employees', value: profile.employees, icon: Users },
                      { label: 'No. of Onshore Staff', value: profile.onshoreStaff, icon: UserCheck },
                    ]}
                  />
                </Section>

                <Section flush title="Address">
                  <Values
                    tint="bg-emerald-50 text-emerald-600"
                    rows={[
                      { label: 'Address 1', value: profile.address1, wide: true, icon: MapPin },
                      { label: 'Address 2', value: profile.address2, wide: true, icon: MapPin },
                      { label: 'Country', value: profile.country, icon: Flag },
                      { label: 'State', value: profile.state, icon: Landmark },
                      { label: 'City', value: profile.city, icon: Building2 },
                      { label: 'Zip Code', value: profile.zipCode, icon: Hash },
                    ]}
                  />
                </Section>

                <Section flush title="Online Presence">
                  <Values
                    tint="bg-indigo-50 text-indigo-600"
                    rows={[
                      { label: 'Website', value: shortUrl(profile.website), wide: true, icon: Globe },
                      { label: 'LinkedIn', value: shortUrl(profile.linkedin), wide: true, icon: Link2 },
                      { label: 'X', value: shortUrl(profile.twitter), wide: true, icon: Link2 },
                      { label: 'Facebook', value: shortUrl(profile.facebook), wide: true, icon: Link2 },
                    ]}
                  />
                </Section>

                <Section flush title="Services Provided">
                  <Values tint="bg-amber-50 text-amber-600" rows={[{ label: 'Services', value: profile.services.join(', '), wide: true, icon: Briefcase }]} />
                </Section>

                {agreements.length > 0 && (
                  <Section flush title="Legal Agreements">
                    <ul>
                      {agreements.map((a, i) => (
                        <li key={a.id}>
                          <ProfileRow
                            icon={FileText}
                            tint="bg-slate-100 text-slate-600"
                            last={i === agreements.length - 1}
                            trailing={
                              perm.download && (
                                <button
                                  type="button"
                                  onClick={() => showNotice(`Downloading ${a.fileName}`)}
                                  aria-label={`Download ${a.fileName}`}
                                  className="w-11 h-11 -my-2 flex items-center justify-center cursor-pointer shrink-0 rounded-full text-[#2F68FE] active:bg-blue-50"
                                >
                                  <Download className="w-4.5 h-4.5" />
                                </button>
                              )
                            }
                          >
                            <span className="block text-[13px] font-semibold text-[#1E293B] leading-snug break-words">{a.fileName}</span>
                          </ProfileRow>
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
        <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className={`grid gap-2.5 grid-cols-[1fr_2fr]`}>
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
              className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
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
