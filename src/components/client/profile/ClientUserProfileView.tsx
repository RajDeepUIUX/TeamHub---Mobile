import React, { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Info,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRoundPen,
} from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { ProfileAvatar } from '../../profile/ProfileAvatar';
import { ChangePasswordSheet } from '../../profile/ChangePasswordSheet';
import { ConfirmSheet, DateField, Pill, fieldInputClass, useNotice } from '../staff/tabs/StaffTabParts';
import { useClientRole } from '../context/ClientPermissionContext';
import { NameChangeSheet } from './NameChangeSheet';
import { PhotoActionSheet, PhotoCropSheet } from './ProfilePhotoSheets';
import { DisabledSelect, ErrorText, Label, LockedField, ProfileSkeleton, SectionCard, ValueGrid } from './ProfileParts';
import {
  ADDRESS_MAX,
  CLIENT_COUNTRIES,
  CLIENT_TIME_ZONES,
  ClientUserProfile,
  PROFILE_PHOTO_MAX_MB,
  PROFILE_PHOTO_TYPES,
  ZIP_MAX,
  citiesOf,
  formatUsPhone,
  statesOf,
  timeZoneLabel,
} from '../data/clientUserProfileData';

const LOAD_MS = 600;

type Errors = Partial<Record<'phone' | 'zipCode' | 'timeZone', string>>;

const formatDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '';

const formatSynced = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/* --------------------------------- Screen --------------------------------- */

/**
 * User Profile (desktop profile menu → User Profile). Same fields as desktop's Update Profile modal;
 * MyCPE ONE rules on top: name changes go through a request, email is managed by MyCPE ONE for ERP clients,
 * time zone is kept, and every save syncs the contact to MyCPE ONE (Part F #14).
 */
export const ClientUserProfileView: React.FC<{
  profile: ClientUserProfile;
  photoUrl: string | null;
  companyName: string;
  onSave: (profile: ClientUserProfile) => void;
  onPhotoChange: (url: string | null) => void;
  onContactManager: () => void;
}> = ({ profile, photoUrl, companyName, onSave, onPhotoChange, onContactManager }) => {
  const role = useClientRole();
  const [loading, setLoading] = useState(true);
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
  const location = [profile.city, profile.state].filter(Boolean).join(', ') || profile.country;

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
    const found: Errors = {};
    const digits = draft.phone.replace(/\D/g, '');
    if (digits && digits.length !== 10) found.phone = 'Enter a valid 10-digit phone number.';
    if (draft.zipCode && draft.zipCode.length < 5) found.zipCode = 'Zip code must be at least 5 digits.';
    if (!draft.timeZone) found.timeZone = 'Time zone is required.';
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      scrollRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      onSave({ ...draft, address: draft.address.trim(), lastSyncedAt: new Date().toISOString() });
      setSaving(false);
      setEditing(false);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      showNotice('Profile updated and synced to MyCPE ONE.');
    }, 700);
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

  const v = editing ? draft : profile;
  const states = statesOf(v.country);
  const cities = citiesOf(v.country, v.state);

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Success banner floats over the content so it's seen wherever the user is scrolled */}
      {notice && <div className="absolute top-3 inset-x-4 z-20 pointer-events-none">{notice}</div>}
      {photoError && (
        <div className="absolute top-3 inset-x-4 z-20" role="alert">
          <p className="px-3 py-2.5 rounded-xl bg-[#FEF2F2] border border-rose-200 text-[12px] font-semibold text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
            {photoError}
          </p>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Account <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">User Profile</span>
          </p>
          <div className="mt-0.5 flex items-center justify-between gap-3 mb-1.5">
            <h1 className="text-xl font-extrabold leading-tight">{editing ? 'Edit Profile' : 'User Profile'}</h1>
            {editing && (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10.5px] font-bold flex items-center gap-1 shrink-0">
                <Pencil className="w-3 h-3" />
                Editing
              </span>
            )}
          </div>
          <p className="mt-1 text-[11.5px] text-slate-500">Your details in the Client Hub and MyCPE ONE</p>
        </div>

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <div className="px-4 mt-4 space-y-3 animate-in fade-in duration-200">
            {/* Identity */}
            <section className="bg-white rounded-3xl p-4 border border-white shadow-[0_12px_32px_-16px_rgba(79,70,229,0.3)]">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <span className="block w-18 h-18 rounded-2xl bg-linear-to-br from-amber-200 via-rose-200 to-violet-300 p-0.5">
                    <ProfileAvatar name={fullName} photoUrl={photoUrl} className="w-full h-full rounded-[14px]" textClassName="text-xl" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhotoSheet(true)}
                    className="absolute -right-3 -bottom-3 w-11 h-11 flex items-center justify-center cursor-pointer group"
                    aria-label={photoUrl ? 'Change profile photo' : 'Add profile photo'}
                  >
                    <span className="w-7.5 h-7.5 rounded-full bg-[#2F68FE] border-2 border-white text-white flex items-center justify-center shadow-xs group-active:bg-[#1D4ED8]">
                      <Camera className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2 className="text-lg font-extrabold leading-tight truncate">{fullName}</h2>
                    <BadgeCheck className="w-4.5 h-4.5 text-[#2F68FE] shrink-0" aria-label="Verified" />
                  </div>
                  <p className="text-[11.5px] text-slate-500 leading-snug mt-0.5 truncate">
                    {profile.designation} · {companyName}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Pill tone="indigo">
                      <ShieldCheck className="w-3 h-3" />
                      {role.name}
                    </Pill>
                    {pendingName && <Pill tone="amber">Name change pending</Pill>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[
                  { icon: Mail, text: profile.email },
                  { icon: Phone, text: profile.phone },
                  { icon: MapPin, text: location },
                  { icon: Clock3, text: timeZoneLabel(profile.timeZone) },
                ]
                  .filter((c) => c.text)
                  .map(({ icon: Icon, text }) => (
                    <span key={text} className="max-w-full inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 text-[11px] font-medium text-slate-600">
                      <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{text}</span>
                    </span>
                  ))}
              </div>
            </section>

            {editing ? (
              <>
                <p className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/80 text-[11px] text-slate-500">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Locked fields are managed by MyCPE ONE.
                </p>

                <SectionCard title="Basic Details">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <LockedField label="First Name" value={profile.firstName} />
                      <LockedField label="Last Name" value={profile.lastName} />
                    </div>
                    <p className="-mt-2 px-0.5 text-[10.5px] text-slate-400 leading-relaxed">
                      {pendingName ? 'Your name change request is being reviewed.' : 'To change your name, use Request Name Change on your profile.'}
                    </p>
                    <LockedField label="Email" value={profile.email} note="Your sign-in email for the Client Hub and MyCPE ONE." />
                    <label className="block space-y-1.5" data-field="phone">
                      <Label text="Phone No." />
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={draft.phone}
                        onChange={(e) => set('phone', formatUsPhone(e.target.value))}
                        placeholder="999-999-9999"
                        aria-invalid={Boolean(errors.phone)}
                        className={`${fieldInputClass(errors.phone)} tabular-nums`}
                      />
                      <ErrorText error={errors.phone} />
                    </label>
                    <DateField label="Birth Date" value={draft.birthDate} onChange={(iso) => set('birthDate', iso)} />
                  </div>
                </SectionCard>

                <SectionCard title="Address & Time Zone">
                  <div className="space-y-4">
                    <label className="block space-y-1.5">
                      <Label text="Address" hint={`${draft.address.length}/${ADDRESS_MAX}`} />
                      <input
                        type="text"
                        autoComplete="street-address"
                        value={draft.address}
                        onChange={(e) => set('address', e.target.value.slice(0, ADDRESS_MAX))}
                        placeholder="Street, building, suite"
                        className={fieldInputClass()}
                      />
                    </label>
                    <div className="space-y-1.5">
                      <Label text="Country" />
                      <Dropdown
                        ariaLabel="Country"
                        value={draft.country || null}
                        placeholder="Select country"
                        options={CLIENT_COUNTRIES}
                        onChange={(c) => {
                          if (c === draft.country) return;
                          setDraft((d) => ({ ...d, country: c, state: '', city: '' }));
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <Label text="State" />
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
                            }}
                          />
                        ) : (
                          <DisabledSelect text="Pick country" />
                        )}
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <Label text="City" />
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
                      </div>
                    </div>
                    <label className="block space-y-1.5" data-field="zipCode">
                      <Label text="Zip Code" />
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
                      <Label text="Time Zone" required />
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
                </SectionCard>
              </>
            ) : (
              <>
                <SectionCard
                  title="Basic Details"
                  action={
                    !pendingName && (
                      <button
                        type="button"
                        onClick={() => setNameSheet(true)}
                        className="h-8 -mr-1.5 px-2 rounded-lg text-[11px] font-bold text-[#2F68FE] flex items-center gap-1 active:bg-[#EFF6FF] cursor-pointer"
                      >
                        <UserRoundPen className="w-3.5 h-3.5" />
                        Request Name Change
                      </button>
                    )
                  }
                >
                  {pendingName && (
                    <div className="mb-3.5 px-3 py-2.5 rounded-xl bg-[#FEF8E7] border border-[#FDE68A]">
                      <p className="flex items-center justify-between gap-2 text-[11.5px] font-bold text-amber-800">
                        Name change requested
                        <Pill tone="amber">Pending Approval</Pill>
                      </p>
                      <p className="mt-1 text-[11.5px] text-amber-800/90 leading-relaxed">
                        New name <span className="font-semibold">{pendingName.firstName} {pendingName.lastName}</span> · submitted{' '}
                        {formatDate(pendingName.submittedAt.slice(0, 10))}. We'll update your profile once it's verified.
                      </p>
                    </div>
                  )}
                  <ValueGrid
                    rows={[
                      { label: 'First Name', value: profile.firstName, locked: true },
                      { label: 'Last Name', value: profile.lastName, locked: true },
                      { label: 'Email', value: profile.email, wide: true, locked: true },
                      { label: 'Phone No.', value: profile.phone },
                      { label: 'Birth Date', value: formatDate(profile.birthDate) },
                    ]}
                  />
                </SectionCard>

                <SectionCard title="Address & Time Zone">
                  <ValueGrid
                    rows={[
                      { label: 'Address', value: profile.address, wide: true },
                      { label: 'City', value: profile.city },
                      { label: 'State', value: profile.state },
                      { label: 'Country', value: profile.country },
                      { label: 'Zip Code', value: profile.zipCode },
                      { label: 'Time Zone', value: timeZoneLabel(profile.timeZone), wide: true },
                    ]}
                  />
                </SectionCard>

                <SectionCard title="Account & Security">
                  <ul className="-mx-1 -my-1 divide-y divide-slate-100">
                    <li>
                      <button
                        type="button"
                        onClick={() => setPasswordSheet(true)}
                        className="w-full min-h-14 px-1 py-2 flex items-center gap-3 text-left rounded-xl active:bg-slate-50 cursor-pointer"
                      >
                        <span className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                          <KeyRound className="w-4.5 h-4.5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] font-semibold text-[#1E293B]">Change Password</span>
                          <span className="block text-[11px] text-slate-400 truncate">Also updates your MyCPE ONE sign-in</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </button>
                    </li>
                    <li className="min-h-14 px-1 py-2 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4.5 h-4.5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-[#1E293B]">{role.name}</span>
                        <span className="block text-[11px] text-slate-400 truncate">Contact role · set by your firm admin</span>
                      </span>
                    </li>
                    <li className="min-h-14 px-1 py-2 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <Building2 className="w-4.5 h-4.5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-[#1E293B] truncate">{companyName}</span>
                        <span className="block text-[11px] text-slate-400 truncate">Client since {formatDate(profile.memberSince)}</span>
                      </span>
                    </li>
                    <li className="min-h-14 px-1 py-2 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0">
                        <RefreshCw className="w-4.5 h-4.5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-[#1E293B]">Synced with MyCPE ONE</span>
                        <span className="block text-[11px] text-slate-400 truncate">Last synced {formatSynced(profile.lastSyncedAt)}</span>
                      </span>
                    </li>
                  </ul>
                </SectionCard>

                <p className="px-1 text-[11px] text-slate-400 leading-relaxed">
                  Need to change your email?{' '}
                  <button type="button" onClick={onContactManager} className="font-bold text-[#2F68FE] cursor-pointer">
                    Contact your Account Manager
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer: Edit (view) or Cancel / Save (edit) */}
      {!loading && (
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
