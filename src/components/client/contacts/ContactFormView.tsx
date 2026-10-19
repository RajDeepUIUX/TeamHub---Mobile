import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Loader2, Mail } from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { ConfirmSheet, DateField, fieldInputClass } from '../staff/tabs/StaffTabParts';
import { ErrorText, Label, LockedField } from '../profile/ProfileParts';
import { CLIENT_COUNTRIES, statesOf, timeZoneLabel } from '../data/clientUserProfileData';
import {
  CONTACT_DESIGNATIONS,
  CONTACT_LIMITS,
  CONTACT_QUALIFICATIONS,
  CONTACT_SAVE_MS,
  CONTACT_TITLES,
  ClientContact,
  ClientContactDraft,
  ClientContactErrors,
  EMPTY_CONTACT_DRAFT,
  draftOfContact,
  formatContactPhone,
  validateContactDraft,
} from '../data/clientContactsData';

export interface ContactCompanyAddress {
  address: string;
  city: string;
  zipCode: string;
  country: string;
  state: string;
  timeZone: string;
}

interface Props {
  /** Editing this contact; empty = Add New Contact */
  contact?: ClientContact;
  /** Every other contact of the firm (duplicate email check) */
  others: ClientContact[];
  company: ContactCompanyAddress;
  onBack: () => void;
  onSave: (draft: ClientContactDraft) => void;
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
    <h2 className="px-4 py-3 bg-[#F8FAFC] border-b border-[#EBF0F7] text-sm font-bold text-[#1E293B]">{title}</h2>
    <div className="p-4 space-y-4">{children}</div>
  </section>
);

const CheckRow: React.FC<{ label: string; hint?: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }> = ({
  label,
  hint,
  checked,
  disabled,
  onChange,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-disabled={disabled}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
      checked ? 'border-[#BFDBFE] bg-[#EFF6FF]' : 'border-[#EBF0F7] bg-white active:bg-slate-50'
    } ${disabled ? 'opacity-70' : ''}`}
  >
    <span
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'}`}
      aria-hidden="true"
    >
      {checked && <Check className="w-3 h-3 stroke-[3]" />}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] font-semibold text-[#1E293B]">{label}</span>
      {hint && <span className="block text-[11px] text-slate-500 leading-snug">{hint}</span>}
    </span>
  </button>
);

/**
 * Add / Edit Contact (desktop `contacts&task=mycontact`): personal details, contact numbers, address (defaults to the
 * firm's address), social links and the contact flags. First name, last name and business email are required.
 */
export const ContactFormView: React.FC<Props> = ({ contact, others, company, onBack, onSave }) => {
  const isEdit = Boolean(contact);
  const credentialsSent = Boolean(contact?.username);
  const initial = useRef<ClientContactDraft>(
    contact
      ? draftOfContact(contact)
      : {
          ...EMPTY_CONTACT_DRAFT,
          address: company.address,
          city: company.city,
          zipCode: company.zipCode,
          country: company.country,
          state: company.state,
        },
  );
  const [draft, setDraft] = useState<ClientContactDraft>(initial.current);
  const [errors, setErrors] = useState<ClientContactErrors>({});
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial.current);
  const usesCompanyAddress =
    draft.address === company.address &&
    draft.city === company.city &&
    draft.zipCode === company.zipCode &&
    draft.country === company.country &&
    draft.state === company.state;

  const set = <K extends keyof ClientContactDraft>(key: K, value: ClientContactDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (key in e ? { ...e, [key]: undefined } : e));
  };

  const useCompanyAddress = (on: boolean) =>
    setDraft((d) =>
      on
        ? { ...d, address: company.address, city: company.city, zipCode: company.zipCode, country: company.country, state: company.state }
        : { ...d, address: '', city: '', zipCode: '', country: '', state: '' },
    );

  const back = () => (dirty && !saving ? setDiscardOpen(true) : onBack());

  const submit = () => {
    const final: ClientContactDraft = {
      ...draft,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      businessEmail: draft.businessEmail.trim(),
      personalEmail: draft.personalEmail.trim(),
      secondEmail: draft.secondEmail.trim(),
      notes: draft.notes.trim(),
    };
    const found = validateContactDraft(final, others);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => bodyRef.current?.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return;
    }
    setSaving(true);
    timer.current = setTimeout(() => onSave(final), CONTACT_SAVE_MS);
  };

  const text = (key: 'firstName' | 'lastName' | 'businessEmail' | 'personalEmail' | 'secondEmail' | 'city' | 'skype', label: string, extra?: { required?: boolean; type?: string; autoComplete?: string; max?: number }) => (
    <label className="block space-y-1.5">
      <Label text={label} required={extra?.required} />
      <input
        type={extra?.type ?? 'text'}
        autoComplete={extra?.autoComplete}
        value={draft[key]}
        maxLength={extra?.max}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={Boolean(errors[key])}
        className={fieldInputClass(errors[key])}
      />
      <ErrorText error={errors[key]} />
    </label>
  );

  const phone = (key: 'mobile' | 'directPhone' | 'phone', label: string) => (
    <label className="block space-y-1.5">
      <Label text={label} />
      <input
        type="tel"
        inputMode="tel"
        value={draft[key]}
        onChange={(e) => set(key, formatContactPhone(e.target.value))}
        placeholder="999-999-9999"
        aria-invalid={Boolean(errors[key])}
        className={fieldInputClass(errors[key])}
      />
      <ErrorText error={errors[key]} />
    </label>
  );

  const link = (key: 'linkedin' | 'facebook' | 'instagram' | 'twitter', label: string) => (
    <label className="block space-y-1.5">
      <Label text={label} />
      <input
        type="url"
        value={draft[key]}
        maxLength={CONTACT_LIMITS.social}
        onChange={(e) => set(key, e.target.value)}
        placeholder="https://"
        aria-invalid={Boolean(errors[key])}
        className={fieldInputClass(errors[key])}
      />
      <ErrorText error={errors[key]} />
    </label>
  );

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        <button type="button" onClick={back} aria-label="Back to Client Contacts" className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold screen-title">{isEdit ? 'Edit Contact' : 'Add New Contact'}</h1>
      </header>

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-3.5">
        <SectionCard title="Personal Details">
          <div className="space-y-1.5">
            <Label text="Title" />
            <Dropdown
              ariaLabel="Title"
              value={draft.title || null}
              placeholder="Select title"
              options={CONTACT_TITLES}
              onChange={(v) => set('title', v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {text('firstName', 'First Name', { required: true, autoComplete: 'given-name', max: CONTACT_LIMITS.name })}
            {text('lastName', 'Last Name', { required: true, autoComplete: 'family-name', max: CONTACT_LIMITS.name })}
          </div>
          <div className="space-y-1.5">
            <Label text="Designation" />
            <Dropdown
              ariaLabel="Designation"
              sheetTitle="Designation"
              value={draft.designation || null}
              placeholder="Select designation"
              options={CONTACT_DESIGNATIONS}
              onChange={(v) => set('designation', v)}
            />
          </div>
          <DateField label="Date of Birth" value={draft.birthDate} onChange={(iso) => set('birthDate', iso)} max={todayIso()} />
          <MultiSelectDropdown
            label="Qualification"
            placeholder="Select qualification"
            options={CONTACT_QUALIFICATIONS.map((q) => ({ value: q, label: q }))}
            selected={draft.qualification}
            onChange={(next) => set('qualification', next)}
          />
          <LockedField label="Time Zone" value={timeZoneLabel(company.timeZone)} note="Follows your firm's time zone (Company Profile)." />
        </SectionCard>

        <SectionCard title="Contact Details">
          {text('businessEmail', 'Business Email', { required: true, type: 'email', autoComplete: 'email' })}
          {text('personalEmail', 'Personal Email', { type: 'email' })}
          {text('secondEmail', 'Second Email', { type: 'email' })}
          {phone('mobile', 'Mobile')}
          {phone('directPhone', 'Direct Phone')}
          <div className="grid grid-cols-[3fr_2fr] gap-3">
            {phone('phone', 'Phone')}
            <label className="block space-y-1.5">
              <Label text="Ext" />
              <input
                type="text"
                inputMode="numeric"
                value={draft.ext}
                onChange={(e) => set('ext', e.target.value.replace(/\D/g, '').slice(0, CONTACT_LIMITS.ext))}
                placeholder="1234"
                aria-invalid={Boolean(errors.ext)}
                className={fieldInputClass(errors.ext)}
              />
              <ErrorText error={errors.ext} />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Address">
          <CheckRow label="Same as company address" hint="Fills the address from your Company Profile" checked={usesCompanyAddress} onChange={useCompanyAddress} />
          <label className="block space-y-1.5">
            <Label text="Address" />
            <input
              type="text"
              autoComplete="street-address"
              value={draft.address}
              maxLength={CONTACT_LIMITS.address}
              onChange={(e) => set('address', e.target.value)}
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
                setDraft((d) => ({ ...d, country: c, state: '' }));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label text="State" />
            <Dropdown
              ariaLabel="State"
              sheetTitle="State"
              value={draft.state || null}
              placeholder={draft.country ? 'Select state' : 'Select country first'}
              options={statesOf(draft.country)}
              onChange={(s) => set('state', s)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {text('city', 'City', { autoComplete: 'address-level2' })}
            <label className="block space-y-1.5">
              <Label text="Zip Code" />
              <input
                type="text"
                autoComplete="postal-code"
                value={draft.zipCode}
                onChange={(e) => set('zipCode', e.target.value.slice(0, CONTACT_LIMITS.zip))}
                className={fieldInputClass()}
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Social & Notes">
          {link('linkedin', 'LinkedIn')}
          {link('facebook', 'Facebook')}
          {link('instagram', 'Instagram')}
          {link('twitter', 'Twitter')}
          {text('skype', 'Skype ID')}
          <div className="space-y-1.5">
            <label htmlFor="contact-notes">
              <Label text="General Notes" hint={`${draft.notes.length}/${CONTACT_LIMITS.notes}`} />
            </label>
            <textarea
              id="contact-notes"
              rows={3}
              value={draft.notes}
              maxLength={CONTACT_LIMITS.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text"
            />
          </div>
        </SectionCard>

        <SectionCard title="Contact Preferences">
          <div className="space-y-2">
            <CheckRow label="Invoices" hint="Receives invoice emails" checked={draft.invoices} onChange={(v) => set('invoices', v)} />
            <CheckRow label="Primary Contact" checked={draft.isPrimary} onChange={(v) => set('isPrimary', v)} />
            <CheckRow label="Decision Maker" checked={draft.decisionMaker} onChange={(v) => set('decisionMaker', v)} />
            <CheckRow label="Reporting Manager" checked={draft.reportingManager} onChange={(v) => set('reportingManager', v)} />
            <CheckRow label="Opt Out" hint="Skip mass email campaigns" checked={draft.optOutEmails} onChange={(v) => set('optOutEmails', v)} />
            <CheckRow label="Timesheet" hint="Receives timesheet emails" checked={draft.timesheet} onChange={(v) => set('timesheet', v)} />
            <CheckRow label="iMessage" checked={draft.iMessage} onChange={(v) => set('iMessage', v)} />
          </div>
        </SectionCard>

        <SectionCard title="Partner Portal Access">
          <CheckRow
            label="Partner Portal Admin"
            hint="Can add and edit the firm's contacts"
            checked={draft.isAdmin}
            onChange={(v) => set('isAdmin', v)}
          />
          <CheckRow
            label="Send Partner Portal Credentials"
            hint={credentialsSent ? `Already sent · username ${contact?.username}` : 'Emails the username and a temporary password to the business email'}
            checked={credentialsSent || draft.sendCredentials}
            disabled={credentialsSent}
            onChange={(v) => set('sendCredentials', v)}
          />
          {!credentialsSent && draft.sendCredentials && (
            <p className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-blue-900 leading-snug">
              <Mail className="w-4 h-4 shrink-0 mt-px" />
              Credentials are emailed when you save.
            </p>
          )}
        </SectionCard>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 pb-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={back}
          disabled={saving}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving || (isEdit && !dirty)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Contact'}
        </button>
      </div>

      <ConfirmSheet
        isOpen={discardOpen}
        title="Discard Changes?"
        message={isEdit ? 'The changes you made to this contact will not be saved.' : 'The contact you started will not be saved.'}
        confirmLabel="Discard"
        danger
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          onBack();
        }}
      />
    </div>
  );
};
