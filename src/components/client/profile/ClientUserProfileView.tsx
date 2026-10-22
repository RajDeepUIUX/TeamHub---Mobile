import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BadgeCheck, Building2, Camera, Check, ChevronRight, Clock, KeyRound, Pencil, ShieldCheck, UserPen, UserRound } from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { ProfileAvatar } from '../../profile/ProfileAvatar';
import { ChangePasswordSheet } from '../../profile/ChangePasswordSheet';
import { ConfirmSheet, DateField, Pill, ScreenHeader, fieldInputClass, useNotice } from '../staff/tabs/StaffTabParts';
import { useClientRole } from '../context/ClientPermissionContext';
import { NameChangeSheet } from './NameChangeSheet';
import { PhotoActionSheet, PhotoCropSheet } from './ProfilePhotoSheets';
import { QualificationSheet } from './QualificationSheet';
import { LearningPreferencePanel, QualificationsPanel } from './UserProfilePanels';
import {
  BandSectionCard,
  DisabledSelect,
  ErrorText,
  FieldGroup,
  FieldInfoSheet,
  InfoButton,
  Label,
  LockedField,
  ProfileSkeleton,
  RemovableTags,
  ValueGrid,
} from './ProfileParts';
import { INDUSTRY_OPTIONS } from '../data/clientCompanyProfileData';
import {
  ADDRESS_MAX,
  CLIENT_COUNTRIES,
  CLIENT_TIME_ZONES,
  ClientQualification,
  ClientSecondAddress,
  ClientUserProfile,
  DESIGNATIONS,
  FollowedSpeaker,
  ORGANIZATION_CATEGORIES,
  PROFILE_PHOTO_MAX_MB,
  PROFILE_PHOTO_TYPES,
  ZIP_MAX,
  citiesOf,
  formatUsPhone,
  qualificationMeta,
  statesOf,
  syncedLicenseIds,
  timeZoneLabel,
} from '../data/clientUserProfileData';

const LOAD_MS = 600;

type ProfileTab = 'basic' | 'qualifications' | 'learning';

/** B `common-profile` tab titles + `#selected-tab-text` copy */
const TABS: { id: ProfileTab; label: string; text: string }[] = [
  { id: 'basic', label: 'Basic Details', text: 'Enter your basic details to get started and personalize your Compliance journey.' },
  { id: 'qualifications', label: 'Qualification Details', text: 'Enter your qualification details to ensure accurate Compliance tracking.' },
  { id: 'learning', label: 'Learning Preference', text: 'Select your preferred topic areas to personalize your learning for compliance goals.' },
];

type FieldKey =
  | 'mobile'
  | 'phone'
  | 'organizationCategory'
  | 'designation'
  | 'industries'
  | 'address'
  | 'country'
  | 'state'
  | 'city'
  | 'zipCode'
  | 'timeZone';
type Errors = Partial<Record<FieldKey, string>>;

const onlyZeros = (v: string) => /^0+$/.test(v.replace(/\D/g, ''));
const phoneError = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d.length !== 10 || onlyZeros(d);
};

/** B `#my-profile-update` rules (+ zip ≥5 digits, Added by designer) */
const validate = (p: ClientUserProfile): Errors => {
  const e: Errors = {};
  if (p.mobile && phoneError(p.mobile)) e.mobile = 'Please enter a valid mobile number.';
  if (!p.phone) e.phone = 'Please enter phone number.';
  else if (phoneError(p.phone)) e.phone = 'Please enter a valid phone number.';
  if (!p.organizationCategory) e.organizationCategory = 'Please select organization category.';
  if (!p.designation) e.designation = 'Please select designation.';
  if (!p.industries.length) e.industries = 'Select an industry that matches your organization.';
  if (!p.address.trim()) e.address = 'Please enter complete address.';
  if (!p.country) e.country = 'Select your Country.';
  if (!p.state) e.state = 'Select your State.';
  if (!p.city) e.city = 'Select your City.';
  if (!p.zipCode) e.zipCode = 'Postal Code is required.';
  else if (onlyZeros(p.zipCode) || p.zipCode.length < 5) e.zipCode = 'Please enter valid postal code.';
  if (!p.timeZone) e.timeZone = 'Select your Timezone.';
  return e;
};

const formatDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '';

const SYNC_FIELD = { ptin: 'PTIN No.', ctec: 'CTEC No.', cfp: 'CFP Board No.' } as const;

/** Desktop ⓘ tooltip copy (B `common-profile`) — shown in a bottom drawer on mobile */
const FIELD_INFO = {
  birthDate: {
    title: 'Date of Birth',
    text: 'As part of our commitment to ensuring full compliance with NASBA (National Association of State Boards of Accountancy) and other regulatory body standards, we require your birth date. This information helps us accurately track and report your continuing education credits to the relevant state boards, ensuring you meet the necessary requirements for your professional qualifications. Your personal information is kept secure and is used strictly for compliance purposes.',
  },
  ptin: {
    title: 'PTIN No.',
    text: "PTIN is set from your Qualification Details (IRS qualifications' license number, e.g. EA, AFSP) and cannot be edited here.",
  },
  ctec: {
    title: 'CTEC No.',
    text: 'CTEC No. is set from your Qualification Details (CTEC license number) and cannot be edited here.',
  },
  cfp: {
    title: 'CFP Board No.',
    text: 'CFP Board No. is set from your Qualification Details (CFP license number) and cannot be edited here.',
  },
} as const;
type InfoKey = keyof typeof FIELD_INFO;

/* --------------------------------- Screen --------------------------------- */

/**
 * User Profile — desktop now opens MyCPE ONE `dashboard/common-profile`, so its layout is used: Change Password +
 * Learning Profile up top, Basic Details / Qualification Details / Learning Preference tabs. B rules on top of A's
 * Update Profile modal: name change by request, email locked, PTIN / CTEC / CFP read-only (filled from qualifications),
 * and every save syncs the contact to MyCPE ONE (Part F #14).
 */
export const ClientUserProfileView: React.FC<{
  profile: ClientUserProfile;
  photoUrl: string | null;
  companyName: string;
  onSave: (profile: ClientUserProfile) => void;
  onPhotoChange: (url: string | null) => void;
  onContactManager: () => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}> = ({ profile, photoUrl, companyName, onSave, onPhotoChange, onContactManager, onBack }) => {
  const role = useClientRole();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ProfileTab>('basic');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClientUserProfile>(profile);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [nameSheet, setNameSheet] = useState(false);
  const [passwordSheet, setPasswordSheet] = useState(false);
  const [qualSheet, setQualSheet] = useState<{ open: boolean; qualification: ClientQualification | null }>({ open: false, qualification: null });
  const [deleteQual, setDeleteQual] = useState<ClientQualification | null>(null);
  const [unfollow, setUnfollow] = useState<FollowedSpeaker | null>(null);
  const [info, setInfo] = useState<InfoKey | null>(null);
  const [notice, showNotice] = useNotice();
  const fileInput = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!photoError) return;
    const t = setTimeout(() => setPhotoError(''), 3200);
    return () => clearTimeout(t);
  }, [photoError]);

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const pendingName = profile.nameChange?.status === 'Pending' ? profile.nameChange : null;
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(profile);
  const ids = syncedLicenseIds(profile.qualifications);
  const activeTab = TABS.find((t) => t.id === tab)!;

  const set = <K extends keyof ClientUserProfile>(key: K, value: ClientUserProfile[K]) => {
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
      onSave({ ...draft, address: draft.address.trim(), address2: { ...draft.address2, address: draft.address2.address.trim() }, lastSyncedAt: new Date().toISOString() });
      setSaving(false);
      setEditing(false);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      showNotice('Profile updated and synced to MyCPE ONE.');
    }, 700);
  };

  const pickTab = (next: ProfileTab) => {
    setTab(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!PROFILE_PHOTO_TYPES.includes(file.type)) return setPhotoError('Invalid file type. Only JPG or PNG photos are allowed.');
    if (file.size > PROFILE_PHOTO_MAX_MB * 1024 * 1024) return setPhotoError(`Photo is too large. Maximum size is ${PROFILE_PHOTO_MAX_MB} MB.`);
    setPhotoError('');
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveQualification = (q: ClientQualification) => {
    const exists = profile.qualifications.some((x) => x.id === q.id);
    const qualifications = exists ? profile.qualifications.map((x) => (x.id === q.id ? q : x)) : [...profile.qualifications, q];
    onSave({ ...profile, qualifications, lastSyncedAt: new Date().toISOString() });
    setQualSheet({ open: false, qualification: null });
    const synced = qualificationMeta(q.type).syncsTo;
    showNotice(`Qualification ${exists ? 'updated' : 'added'}.${synced ? ` ${SYNC_FIELD[synced]} updated in Basic Details.` : ''}`);
  };

  const setAddress2 = (patch: Partial<ClientSecondAddress>) => setDraft((d) => ({ ...d, address2: { ...d.address2, ...patch } }));

  const v = editing ? draft : profile;
  const states = statesOf(v.country);
  const cities = citiesOf(v.country, v.state);
  const states2 = statesOf(v.address2.country);
  const cities2 = citiesOf(v.address2.country, v.address2.state);

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* While editing the back arrow works like Cancel */}
      <ScreenHeader
        title={editing ? 'Edit Basic Details' : 'User Profile'}
        onBack={editing ? () => (dirty ? setConfirmDiscard(true) : stopEdit()) : onBack}
        backLabel={editing ? 'Cancel editing' : undefined}
      />
      {/* Success banner floats over the content so it's seen wherever the user is scrolled */}
      {notice && <div className="absolute top-3 inset-x-4 z-30 pointer-events-none">{notice}</div>}
      {photoError && (
        <div className="absolute top-3 inset-x-4 z-30" role="alert">
          <p className="px-3 py-2.5 rounded-xl bg-[#FEF2F2] border border-rose-200 text-[12px] font-semibold text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
            {photoError}
          </p>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {editing ? (
          <div className="px-4 pt-4">
            <p className="text-[11.5px] text-slate-500">Fields marked * are required. Locked fields are managed by MyCPE ONE.</p>
          </div>
        ) : (
          <>
            <div className="px-4 pt-4">
              <h2 className="text-xl font-extrabold leading-tight">{activeTab.label}</h2>
              <p className="mt-1 text-[11.5px] text-slate-500 leading-relaxed">{activeTab.text}</p>
              <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPasswordSheet(true)}
                  className="h-11 rounded-xl bg-white border border-[#4F46E5] text-[#4F46E5] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#EEF2FF] cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => showNotice('Opening your Learning Profile on MyCPE ONE…')}
                  className="h-11 rounded-xl bg-[#4F46E5] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:bg-[#4338CA] cursor-pointer"
                >
                  Learning Profile
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Desktop underline tabs */}
            <nav className="sticky top-0 z-20 mt-3 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-slate-200" aria-label="Profile sections">
              <div className="flex overflow-x-auto no-scrollbar px-2" role="tablist">
                {TABS.map((t) => {
                  const on = t.id === tab;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => pickTab(t.id)}
                      className={`h-11 px-3 -mb-px border-b-2 text-[12.5px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        on ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-500 active:text-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </>
        )}

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <div key={editing ? 'edit' : tab} className="px-4 mt-4 space-y-3 animate-in fade-in duration-200" role={editing ? undefined : 'tabpanel'} aria-label={editing ? undefined : activeTab.label}>
            {editing ? (
              <>
                <BandSectionCard title="Personal Information">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <LockedField label="First Name" value={profile.firstName} />
                      <LockedField label="Last Name" value={profile.lastName} />
                    </div>
                    <p className="-mt-2 px-0.5 text-[10.5px] text-slate-400 leading-relaxed">
                      {pendingName ? 'Your name change request is being reviewed.' : 'To change your name, use Request Name Change on your profile.'}
                    </p>
                    <LockedField label="Email" value={profile.email} note="Your sign-in email for the Client Hub and MyCPE ONE." />
                    <div className="relative">
                      <DateField
                        label="Date of Birth"
                        value={draft.birthDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(iso) => set('birthDate', iso)}
                      />
                      <span className="absolute top-0 right-0">
                        <InfoButton label="Date of Birth" onClick={() => setInfo('birthDate')} />
                      </span>
                    </div>
                    {(
                      [
                        { key: 'mobile', label: 'Mobile Number', required: false },
                        { key: 'phone', label: 'Phone Number', required: true },
                      ] as const
                    ).map((f) => (
                      <label key={f.key} className="block space-y-1.5" data-field={f.key}>
                        <Label text={f.label} required={f.required} />
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete={f.key === 'mobile' ? 'tel' : 'tel-national'}
                          value={draft[f.key]}
                          onChange={(e) => set(f.key, formatUsPhone(e.target.value))}
                          placeholder="(999) 999-9999"
                          aria-invalid={Boolean(errors[f.key])}
                          className={`${fieldInputClass(errors[f.key])} tabular-nums`}
                        />
                        <ErrorText error={errors[f.key]} />
                      </label>
                    ))}
                    <LockedField label="Organization Name" value={companyName} note="From your Company Profile." />
                    <div className="space-y-1.5" data-field="organizationCategory">
                      <Label text="Organization Category" required />
                      <Dropdown
                        ariaLabel="Organization Category"
                        value={draft.organizationCategory || null}
                        placeholder="Select Organization Category"
                        options={ORGANIZATION_CATEGORIES}
                        onChange={(c) => set('organizationCategory', c)}
                      />
                      <ErrorText error={errors.organizationCategory} />
                    </div>
                    <div className="space-y-1.5" data-field="designation">
                      <Label text="Designation" required />
                      <Dropdown
                        ariaLabel="Designation"
                        value={draft.designation || null}
                        placeholder="Select Designation"
                        options={DESIGNATIONS}
                        onChange={(d) => set('designation', d)}
                      />
                      <ErrorText error={errors.designation} />
                    </div>
                    <div className="space-y-1.5" data-field="industries">
                      <MultiSelectDropdown
                        label="Industry *"
                        placeholder="Select Industry"
                        options={INDUSTRY_OPTIONS.map((o) => ({ value: o, label: o }))}
                        selected={draft.industries}
                        onChange={(next) => set('industries', next)}
                        searchable
                      />
                      <RemovableTags items={draft.industries} onRemove={(t) => set('industries', draft.industries.filter((x) => x !== t))} />
                      <ErrorText error={errors.industries} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <LockedField label="PTIN No." value={ids.ptin ? `P${ids.ptin}` : '—'} onInfo={() => setInfo('ptin')} />
                      <LockedField label="CTEC No." value={ids.ctec ? `A${ids.ctec}` : '—'} onInfo={() => setInfo('ctec')} />
                    </div>
                    <LockedField label="CFP Board No." value={ids.cfp || '—'} onInfo={() => setInfo('cfp')} />
                  </div>
                </BandSectionCard>

                <BandSectionCard title="Address Information">
                  <div className="space-y-4">
                    <label className="block space-y-1.5" data-field="address">
                      <Label text="Address" required hint={`${draft.address.length}/${ADDRESS_MAX}`} />
                      <input
                        type="text"
                        autoComplete="street-address"
                        value={draft.address}
                        onChange={(e) => set('address', e.target.value.slice(0, ADDRESS_MAX))}
                        placeholder="Street, building, suite"
                        aria-invalid={Boolean(errors.address)}
                        className={fieldInputClass(errors.address)}
                      />
                      <ErrorText error={errors.address} />
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
                      <Label text="Postal Code" required />
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        value={draft.zipCode}
                        onChange={(e) => set('zipCode', e.target.value.replace(/\D/g, '').slice(0, ZIP_MAX))}
                        placeholder="e.g. 02109"
                        aria-invalid={Boolean(errors.zipCode)}
                        className={`${fieldInputClass(errors.zipCode)} tabular-nums`}
                      />
                      <ErrorText error={errors.zipCode} />
                    </label>
                    <div className="space-y-1.5" data-field="timeZone">
                      <Label text="Timezone" required />
                      <Dropdown
                        ariaLabel="Time Zone"
                        value={draft.timeZone || null}
                        placeholder="Select time zone"
                        options={CLIENT_TIME_ZONES.map((t) => ({ value: t.value, label: t.label, description: t.value }))}
                        onChange={(t) => set('timeZone', t)}
                      />
                      <ErrorText error={errors.timeZone} />
                      <p className="px-0.5 text-[10.5px] text-slate-400">Used for meeting times, reminders and staff shift times.</p>
                    </div>
                  </div>
                </BandSectionCard>

                <BandSectionCard title="Address 2">
                  <div className="space-y-4">
                    <label className="block space-y-1.5">
                      <Label text="Address" hint={`${draft.address2.address.length}/${ADDRESS_MAX}`} />
                      <input
                        type="text"
                        autoComplete="address-line2"
                        value={draft.address2.address}
                        onChange={(e) => setAddress2({ address: e.target.value.slice(0, ADDRESS_MAX) })}
                        placeholder="Street, building, suite"
                        className={fieldInputClass()}
                      />
                    </label>
                    <div className="space-y-1.5">
                      <Label text="Country" />
                      <Dropdown
                        ariaLabel="Address 2 Country"
                        value={draft.address2.country || null}
                        placeholder="Select country"
                        options={CLIENT_COUNTRIES}
                        onChange={(c) => {
                          if (c !== draft.address2.country) setAddress2({ country: c, state: '', city: '' });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <Label text="State" />
                        {states2.length ? (
                          <Dropdown
                            ariaLabel="Address 2 State"
                            value={draft.address2.state || null}
                            placeholder="Select"
                            options={states2}
                            menuMinWidth={220}
                            onChange={(st) => {
                              if (st !== draft.address2.state) setAddress2({ state: st, city: '' });
                            }}
                          />
                        ) : (
                          <DisabledSelect text="Pick country" />
                        )}
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <Label text="City" />
                        {cities2.length ? (
                          <Dropdown
                            ariaLabel="Address 2 City"
                            value={draft.address2.city || null}
                            placeholder="Select"
                            options={cities2}
                            menuMinWidth={200}
                            onChange={(c) => setAddress2({ city: c })}
                          />
                        ) : (
                          <DisabledSelect text="Pick state" />
                        )}
                      </div>
                    </div>
                    <label className="block space-y-1.5">
                      <Label text="Zip Code" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={draft.address2.zipCode}
                        onChange={(e) => setAddress2({ zipCode: e.target.value.replace(/\D/g, '').slice(0, ZIP_MAX) })}
                        placeholder="e.g. 02139"
                        className={`${fieldInputClass()} tabular-nums`}
                      />
                    </label>
                  </div>
                </BandSectionCard>
              </>
            ) : tab === 'basic' ? (
              <>
                <BandSectionCard
                  title="Personal Information"
                  action={
                    pendingName ? (
                      <Pill tone="amber">Pending Approval</Pill>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setNameSheet(true)}
                        className="h-8 -mr-1 px-2.5 rounded-lg bg-white border border-[#E0E7FF] text-[11px] font-bold text-[#4F46E5] flex items-center gap-1 active:bg-[#EEF2FF] cursor-pointer"
                      >
                        <UserPen className="w-3.5 h-3.5" />
                        Request Name Change
                      </button>
                    )
                  }
                >
                  <div className="-mx-4 -mt-4 px-4 pt-5 pb-4 bg-gradient-to-b from-[#F5F7FF] to-white flex flex-col items-center text-center">
                    <div className="relative">
                      <ProfileAvatar
                        name={fullName}
                        photoUrl={photoUrl}
                        className="w-20 h-20 rounded-full ring-4 ring-white shadow-[0_4px_14px_-4px_rgba(79,70,229,0.35)]"
                        textClassName="text-2xl"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoSheet(true)}
                        className="absolute -right-3 -bottom-3 w-11 h-11 flex items-center justify-center cursor-pointer group"
                        aria-label={photoUrl ? 'Change profile photo' : 'Add profile photo'}
                      >
                        <span className="w-8 h-8 rounded-full bg-[#4F46E5] border-2 border-white text-white flex items-center justify-center shadow-sm group-active:bg-[#4338CA]">
                          <Camera className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    </div>
                    <h2 className="mt-3 max-w-full text-[17px] font-extrabold text-[#1E293B] leading-tight truncate">{fullName}</h2>
                    <p className="mt-1 max-w-full text-[12px] text-slate-500 truncate">{profile.email}</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                      <Pill tone="indigo">
                        <ShieldCheck className="w-3 h-3" />
                        {role.name}
                      </Pill>
                      {profile.designation && <Pill tone="slate">{profile.designation}</Pill>}
                    </div>
                  </div>

                  {pendingName && (
                    <div className="mb-1 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[#FEF8E7] border border-[#FDE68A]">
                      <Clock className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-bold text-amber-800">Name change requested</p>
                        <p className="mt-0.5 text-[11.5px] text-amber-800/90 leading-relaxed">
                          New name <span className="font-semibold">{pendingName.firstName} {pendingName.lastName}</span> · submitted{' '}
                          {formatDate(pendingName.submittedAt.slice(0, 10))}. We'll update your profile once it's verified.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-3">
                    <FieldGroup icon={UserRound} title="Personal & Contact">
                      <ValueGrid
                        rows={[
                          { label: 'First Name', value: profile.firstName, locked: true },
                          { label: 'Last Name', value: profile.lastName, locked: true },
                          { label: 'Email', value: profile.email, wide: true, locked: true },
                          { label: 'Date of Birth', value: formatDate(profile.birthDate), onInfo: () => setInfo('birthDate') },
                          { label: 'Mobile Number', value: profile.mobile, href: profile.mobile ? `tel:${profile.mobile.replace(/\D/g, '')}` : undefined },
                          { label: 'Phone Number', value: profile.phone, href: profile.phone ? `tel:${profile.phone.replace(/\D/g, '')}` : undefined },
                        ]}
                      />
                    </FieldGroup>

                    <FieldGroup icon={Building2} title="Organization">
                      <ValueGrid
                        rows={[
                          { label: 'Organization Name', value: companyName, wide: true, locked: true },
                          { label: 'Organization Category', value: profile.organizationCategory, wide: true },
                          { label: 'Designation', value: profile.designation },
                          { label: 'Industry', value: profile.industries.join(', ') },
                        ]}
                      />
                    </FieldGroup>

                    <FieldGroup
                      icon={BadgeCheck}
                      title="Professional IDs"
                      hint="Synced from your qualifications"
                      action={
                        <button
                          type="button"
                          onClick={() => pickTab('qualifications')}
                          className="h-8 -mr-1 px-2 rounded-lg text-[11px] font-bold text-[#2F68FE] flex items-center gap-0.5 active:bg-[#EFF6FF] cursor-pointer shrink-0"
                        >
                          Manage
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      }
                    >
                      <div className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
                        <ValueGrid
                          rows={[
                            { label: 'PTIN No.', value: ids.ptin ? `P${ids.ptin}` : '', locked: true, onInfo: () => setInfo('ptin') },
                            { label: 'CTEC No.', value: ids.ctec ? `A${ids.ctec}` : '', locked: true, onInfo: () => setInfo('ctec') },
                            { label: 'CFP Board No.', value: ids.cfp, locked: true, onInfo: () => setInfo('cfp') },
                          ]}
                        />
                      </div>
                    </FieldGroup>
                  </div>
                </BandSectionCard>

                <BandSectionCard title="Address Information">
                  <ValueGrid
                    rows={[
                      { label: 'Address', value: profile.address, wide: true },
                      { label: 'Country', value: profile.country },
                      { label: 'State', value: profile.state },
                      { label: 'City', value: profile.city },
                      { label: 'Postal Code', value: profile.zipCode },
                      { label: 'Timezone', value: profile.timeZone ? timeZoneLabel(profile.timeZone) : '', wide: true },
                    ]}
                  />
                </BandSectionCard>

                <BandSectionCard title="Address 2">
                  <ValueGrid
                    rows={[
                      { label: 'Address', value: profile.address2.address, wide: true },
                      { label: 'Country', value: profile.address2.country },
                      { label: 'State', value: profile.address2.state },
                      { label: 'City', value: profile.address2.city },
                      { label: 'Zip Code', value: profile.address2.zipCode },
                    ]}
                  />
                </BandSectionCard>

                <p className="px-1 text-[11px] text-slate-400 leading-relaxed">
                  Need to change your email?{' '}
                  <button type="button" onClick={onContactManager} className="font-bold text-[#2F68FE] cursor-pointer">
                    Contact your Account Manager
                  </button>
                </p>
              </>
            ) : tab === 'qualifications' ? (
              <QualificationsPanel
                qualifications={profile.qualifications}
                onAdd={() => setQualSheet({ open: true, qualification: null })}
                onEdit={(q) => setQualSheet({ open: true, qualification: q })}
              />
            ) : (
              <LearningPreferencePanel
                topics={profile.topics}
                speakers={profile.followedSpeakers}
                onSaveTopics={(topics) => {
                  onSave({ ...profile, topics });
                  showNotice('Learning preferences saved.');
                }}
                onUnfollow={setUnfollow}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer (Basic Details only): Edit Profile, or Cancel / Save Changes while editing */}
      {!loading && (editing || tab === 'basic') && (
        <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {editing ? (
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
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      )}

      <input ref={fileInput} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={pickPhoto} />
      <PhotoActionSheet
        isOpen={photoSheet}
        hasPhoto={Boolean(photoUrl)}
        onClose={() => setPhotoSheet(false)}
        onChoose={() => {
          setPhotoSheet(false);
          fileInput.current?.click();
        }}
        onRemove={() => {
          setPhotoSheet(false);
          onPhotoChange(null);
          showNotice('Profile photo removed.');
        }}
      />
      <PhotoCropSheet
        src={cropSrc}
        onClose={() => setCropSrc(null)}
        onSave={(url) => {
          setCropSrc(null);
          onPhotoChange(url);
          showNotice('Profile photo updated.');
        }}
      />
      <NameChangeSheet
        isOpen={nameSheet}
        currentName={fullName}
        onClose={() => setNameSheet(false)}
        onSubmit={(req) => {
          setNameSheet(false);
          onSave({ ...profile, nameChange: { ...req, submittedAt: new Date().toISOString(), status: 'Pending' } });
          showNotice('Name change request submitted for approval.');
        }}
      />
      <ChangePasswordSheet
        isOpen={passwordSheet}
        onClose={() => setPasswordSheet(false)}
        onChanged={() => {
          setPasswordSheet(false);
          showNotice('Password changed for the Client Hub and MyCPE ONE.');
        }}
      />
      <QualificationSheet
        isOpen={qualSheet.open}
        qualification={qualSheet.qualification}
        existing={profile.qualifications}
        onClose={() => setQualSheet({ open: false, qualification: null })}
        onSave={saveQualification}
        onDelete={(q) => {
          setQualSheet({ open: false, qualification: null });
          setDeleteQual(q);
        }}
      />
      <ConfirmSheet
        isOpen={Boolean(deleteQual)}
        title="Delete this qualification?"
        message="It will be removed from your profile and from your CPE compliance tracking."
        note={deleteQual && qualificationMeta(deleteQual.type).syncsTo ? `Its license number will also be cleared from ${SYNC_FIELD[qualificationMeta(deleteQual.type).syncsTo!]} in Basic Details.` : undefined}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteQual(null)}
        onConfirm={() => {
          if (!deleteQual) return;
          onSave({ ...profile, qualifications: profile.qualifications.filter((q) => q.id !== deleteQual.id), lastSyncedAt: new Date().toISOString() });
          setDeleteQual(null);
          showNotice('Qualification deleted.');
        }}
      />
      <ConfirmSheet
        isOpen={Boolean(unfollow)}
        title={`Unfollow ${unfollow?.name ?? 'speaker'}?`}
        message="You'll stop getting updates about their new courses. You can follow them again from their profile page."
        confirmLabel="Unfollow"
        danger
        onClose={() => setUnfollow(null)}
        onConfirm={() => {
          if (!unfollow) return;
          onSave({ ...profile, followedSpeakers: profile.followedSpeakers.filter((s) => s.id !== unfollow.id) });
          setUnfollow(null);
          showNotice(`You unfollowed ${unfollow.name}.`);
        }}
      />
      <FieldInfoSheet info={info ? FIELD_INFO[info] : null} onClose={() => setInfo(null)} />
      <ConfirmSheet
        isOpen={confirmDiscard}
        title="Discard your changes?"
        message="Your edits to your profile haven't been saved."
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
