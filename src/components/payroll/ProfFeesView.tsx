import React, { useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronDown, FileText, MinusCircle, Upload, UserPlus, Users, Wand2, X } from 'lucide-react';
import { Dropdown } from '../../design-system/components/Dropdown';
import { LocationFields } from '../common/LocationFields';
import { FileUploadField } from '../common/FileUploadField';
import { BottomSheet } from '../common/BottomSheet';
import { DateWheelSheet } from '../common/DateWheelSheet';
import { MultiSelectSheet } from '../common/MultiSelectSheet';

/* ---------------------------------- Model ---------------------------------- */

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  /** YYYY-MM-DD */
  dob: string;
}

type FileField = 'panCard' | 'aadhaarCard' | 'chequeImage' | 'resume';

export interface ProfFeeAccount {
  memberId: string;
  vendorCode: string;
  vendorName: string;
  relationship: string;
  dob: string;
  email: string;
  guardianName: string;
  qualification: string;
  bankName: string;
  accountNumber: string;
  nameAsPerBank: string;
  ifsc: string;
  branch: string;
  yearlyFees: string;
  pan: string;
  aadhaar: string;
  /** Uploaded file names, null until chosen */
  panCard: string | null;
  aadhaarCard: string | null;
  chequeImage: string | null;
  resume: string | null;
  remarks: string;
  addressSameAsMine: boolean;
  /** Asked only when the address isn't the same as the staff member's */
  address: string;
  landmark: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

type AccountErrors = Partial<Record<keyof ProfFeeAccount, string>>;

/** Relation Type options in Add New Family Member (as on the web) */
const NEW_MEMBER_RELATIONS = ['Brother', 'Sister', 'Father in-law', 'Mother in-law', 'Sister in-law', 'Brother in-law', 'Cousin'];
/** Nature of Relationship options on an account (as on the web) */
const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Wife',
  'Son',
  'Daughter',
  'Father-in-Law',
  'Mother-in-Law',
  'Sister-in-Law',
  'Cousin',
];
const QUALIFICATIONS = ['Graduate', 'Post Graduate'];
const BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Bank of Baroda',
  'Punjab National Bank',
  'Yes Bank',
];

/** Demo values for Quick Fill; only fills fields that are still empty */
const quickFillAccount = (a: ProfFeeAccount, i: number, staffName: string): ProfFeeAccount => {
  const [first = 'member', ...rest] = a.vendorName.toLowerCase().split(' ');
  const surname = a.vendorName.split(' ').slice(-1)[0] || 'Smith';
  const demo: Partial<ProfFeeAccount> = {
    email: `${first}.${rest.join('') || 'smith'}@gmail.com`,
    guardianName: a.relationship === 'Wife' ? staffName : `Thomas ${surname}`,
    qualification: 'Graduate',
    bankName: 'HDFC Bank',
    accountNumber: `5010023456789${i}`,
    nameAsPerBank: a.vendorName,
    ifsc: 'HDFC0001234',
    branch: 'MG Road',
    yearlyFees: '12000',
    pan: `AQKP${surname[0]?.toUpperCase() ?? 'S'}562${i}L`,
    aadhaar: `48291573620${i}`,
    panCard: 'pan-card.pdf',
    aadhaarCard: 'aadhaar-card.pdf',
    chequeImage: 'cancelled-cheque.jpg',
    resume: 'resume.pdf',
  };
  const next = { ...a };
  for (const [k, v] of Object.entries(demo) as [keyof ProfFeeAccount, ProfFeeAccount[keyof ProfFeeAccount]][]) {
    if (!next[k]) (next as Record<string, unknown>)[k] = v;
  }
  return next;
};

const FIRST_VENDOR_NO = 86;
/** Vendor codes run V00086, V00087, … in family-list order, so a member keeps theirs */
const vendorCode = (members: FamilyMember[], id: string) => {
  const i = members.findIndex((m) => m.id === id);
  return `V${String(FIRST_VENDOR_NO + (i < 0 ? members.length : i)).padStart(5, '0')}`;
};

const newAccount = (m: FamilyMember, code: string): ProfFeeAccount => ({
  memberId: m.id,
  vendorCode: code,
  vendorName: m.name,
  relationship: m.relationship,
  dob: m.dob,
  email: '',
  guardianName: '',
  qualification: '',
  bankName: '',
  accountNumber: '',
  nameAsPerBank: '',
  ifsc: '',
  branch: '',
  yearlyFees: '',
  pan: '',
  aadhaar: '',
  panCard: null,
  aadhaarCard: null,
  chequeImage: null,
  resume: null,
  remarks: '',
  addressSameAsMine: true,
  address: '',
  landmark: '',
  city: '',
  state: '',
  country: '',
  zip: '',
});

/** Required fields in screen order, with the label used in "… is required." */
const REQUIRED: [keyof ProfFeeAccount, string][] = [
  ['vendorName', 'Vendor Name'],
  ['relationship', 'Nature of Relationship'],
  ['dob', 'Date Of Birth'],
  ['email', 'Email'],
  ['guardianName', "Father's / Husband's Name"],
  ['qualification', 'Qualification'],
  ['bankName', 'Bank Name'],
  ['accountNumber', 'Account Number'],
  ['nameAsPerBank', 'Name As Per Bank'],
  ['ifsc', 'IFSC'],
  ['branch', 'Branch'],
  ['yearlyFees', 'Yearly Fees'],
  ['pan', 'PAN Number'],
  ['panCard', 'PAN Card'],
  ['aadhaar', 'Aadhaar Number'],
  ['aadhaarCard', 'Aadhaar Card'],
  ['chequeImage', 'Bank Cheque Image'],
  ['resume', 'Resume'],
];

const validate = (a: ProfFeeAccount): AccountErrors => {
  const e: AccountErrors = {};
  for (const [key, label] of REQUIRED) if (!a[key]) e[key] = `${label} is required.`;
  return e;
};

export const totalProfFees = (accounts: ProfFeeAccount[]) => accounts.reduce((n, a) => n + (Number(a.yearlyFees) || 0), 0);

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const formatDob = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '');

/* --------------------------------- Pieces --------------------------------- */

const inputCls = (bad?: string) =>
  `w-full h-11 px-3.5 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
    bad ? 'border-rose-300' : 'border-slate-200'
  }`;

const Field: React.FC<{ label: string; required?: boolean; error?: string; htmlFor?: string; children: React.ReactNode }> = ({
  label,
  required,
  error,
  htmlFor,
  children,
}) => (
  <div className="min-w-0">
    <label htmlFor={htmlFor} className="block text-[11px] font-semibold text-slate-600 mb-1">
      {required && <span className="text-rose-500">* </span>}
      {label}
    </label>
    {children}
    {error && <p className="mt-1 px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
  </div>
);

const UploadField: React.FC<{
  label: string;
  fileName: string | null;
  error?: string;
  onChange: (name: string | null) => void;
}> = ({ label, fileName, error, onChange }) => (
  <Field label={label} required error={error}>
    {/* Same upload UI as the rest of the app */}
    <FileUploadField fileName={fileName} onChange={onChange} label={`Upload ${label}`} sheetTitle={label} invalid={Boolean(error)} />
  </Field>
);

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="pt-4 mt-1 border-t border-slate-100 text-[13px] font-bold text-[#1E293B]">{children}</h4>
);

/* ------------------------------ Account card ------------------------------ */

const AccountCard: React.FC<{
  index: number;
  account: ProfFeeAccount;
  errors: AccountErrors;
  onChange: (patch: Partial<ProfFeeAccount>) => void;
  onRemove: () => void;
}> = ({ index, account: a, errors: e, onChange, onRemove }) => {
  const [isDobOpen, setIsDobOpen] = useState(false);
  const id = (k: string) => `pf-${a.memberId}-${k}`;
  const text = (k: keyof ProfFeeAccount, opts: { inputMode?: 'text' | 'numeric' | 'email'; maxLength?: number; transform?: (v: string) => string } = {}) => (
    <input
      id={id(k)}
      type={opts.inputMode === 'email' ? 'email' : 'text'}
      inputMode={opts.inputMode}
      autoComplete="off"
      maxLength={opts.maxLength}
      value={a[k] as string}
      onChange={(ev) => onChange({ [k]: opts.transform ? opts.transform(ev.target.value) : ev.target.value })}
      className={inputCls(e[k])}
    />
  );
  const digits = (v: string) => v.replace(/\D/g, '');
  const upperAlnum = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '');

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5 px-3.5 py-3 bg-slate-50 border-b border-slate-100">
        <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-[#1E293B] shrink-0">
          {index + 1}
        </span>
        <h3 className="flex-1 min-w-0 text-[13px] font-bold text-[#1E293B] leading-snug">
          Prof. Fees Account — <span className="text-[#2F68FE]">{a.vendorName || '—'}</span>
        </h3>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 h-8 px-2 -mr-1 rounded-lg text-[11px] font-semibold text-rose-600 active:bg-rose-50 cursor-pointer shrink-0"
        >
          <MinusCircle className="w-4 h-4" />
          Remove
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        <Field label="Vendor Code" htmlFor={id('vendorCode')}>
          <p id={id('vendorCode')} className="h-11 px-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center text-xs text-slate-500">
            {a.vendorCode}
          </p>
        </Field>
        <Field label="Vendor Name" required error={e.vendorName} htmlFor={id('vendorName')}>
          {text('vendorName')}
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Nature of Relationship" required error={e.relationship}>
            <Dropdown
              size="md"
              ariaLabel="Nature of Relationship"
              sheetTitle="Nature of Relationship"
              value={a.relationship || null}
              placeholder="Select"
              options={RELATIONSHIPS.includes(a.relationship) || !a.relationship ? RELATIONSHIPS : [...RELATIONSHIPS, a.relationship]}
              onChange={(v) => onChange({ relationship: v })}
            />
          </Field>
          <Field label="Date Of Birth" required error={e.dob}>
            <button
              type="button"
              onClick={() => setIsDobOpen(true)}
              className={`w-full h-11 px-3 bg-white border rounded-xl flex items-center gap-2 text-xs shadow-2xs cursor-pointer ${
                e.dob ? 'border-rose-300' : 'border-slate-200'
              }`}
            >
              <CalendarDays className={`w-4 h-4 shrink-0 ${a.dob ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
              <span className={`flex-1 text-left tabular-nums ${a.dob ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'}`}>
                {a.dob ? formatDob(a.dob) : 'Select'}
              </span>
            </button>
          </Field>
        </div>
        <Field label="Email" required error={e.email} htmlFor={id('email')}>
          {text('email', { inputMode: 'email' })}
        </Field>
        <Field label="Father's / Husband's Name" required error={e.guardianName} htmlFor={id('guardianName')}>
          {text('guardianName')}
        </Field>
        <Field label="Qualification" required error={e.qualification}>
          <Dropdown
            size="md"
            ariaLabel="Qualification"
            sheetTitle="Qualification"
            value={a.qualification || null}
            placeholder="Select Qualification"
            options={QUALIFICATIONS}
            onChange={(v) => onChange({ qualification: v })}
          />
        </Field>

        <SubHeading>Bank Information</SubHeading>
        <Field label="Bank Name" required error={e.bankName}>
          <Dropdown
            size="md"
            ariaLabel="Bank Name"
            sheetTitle="Bank Name"
            value={a.bankName || null}
            placeholder="Select"
            options={BANKS}
            onChange={(v) => onChange({ bankName: v })}
          />
        </Field>
        <Field label="Account Number" required error={e.accountNumber} htmlFor={id('accountNumber')}>
          {text('accountNumber', { inputMode: 'numeric', maxLength: 18, transform: digits })}
        </Field>
        <Field label="Name As Per Bank" required error={e.nameAsPerBank} htmlFor={id('nameAsPerBank')}>
          {text('nameAsPerBank')}
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="IFSC" required error={e.ifsc} htmlFor={id('ifsc')}>
            {text('ifsc', { maxLength: 11, transform: upperAlnum })}
          </Field>
          <Field label="Branch" required error={e.branch} htmlFor={id('branch')}>
            {text('branch')}
          </Field>
        </div>
        <Field label="Yearly Fees" required error={e.yearlyFees} htmlFor={id('yearlyFees')}>
          {text('yearlyFees', { inputMode: 'numeric', maxLength: 8, transform: (v) => digits(v).replace(/^0+(?=\d)/, '') })}
        </Field>

        <SubHeading>Documents</SubHeading>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="PAN Number" required error={e.pan} htmlFor={id('pan')}>
            {text('pan', { maxLength: 10, transform: upperAlnum })}
          </Field>
          <UploadField label="PAN Card" fileName={a.panCard} error={e.panCard} onChange={(panCard) => onChange({ panCard })} />
          <Field label="Aadhaar Number" required error={e.aadhaar} htmlFor={id('aadhaar')}>
            {text('aadhaar', { inputMode: 'numeric', maxLength: 12, transform: digits })}
          </Field>
          <UploadField label="Aadhaar Card" fileName={a.aadhaarCard} error={e.aadhaarCard} onChange={(aadhaarCard) => onChange({ aadhaarCard })} />
          <UploadField
            label="Bank Cheque Image"
            fileName={a.chequeImage}
            error={e.chequeImage}
            onChange={(chequeImage) => onChange({ chequeImage })}
          />
          <UploadField label="Resume" fileName={a.resume} error={e.resume} onChange={(resume) => onChange({ resume })} />
        </div>
        <Field label="Remarks" htmlFor={id('remarks')}>
          <textarea
            id={id('remarks')}
            rows={3}
            maxLength={500}
            value={a.remarks}
            onChange={(ev) => onChange({ remarks: ev.target.value })}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] resize-none focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
          />
        </Field>

        <SubHeading>Address</SubHeading>
        <button
          type="button"
          role="checkbox"
          aria-checked={a.addressSameAsMine}
          onClick={() => onChange({ addressSameAsMine: !a.addressSameAsMine })}
          className="flex items-center gap-2.5 -mx-1 px-1 py-1 rounded-lg text-xs font-medium text-[#1E293B] active:bg-slate-50 cursor-pointer"
        >
          <span
            className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0 border ${
              a.addressSameAsMine ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-300'
            }`}
          >
            {a.addressSameAsMine && <Check className="w-3 h-3 stroke-[3]" />}
          </span>
          Address, Same as Mine?
        </button>
        {!a.addressSameAsMine && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <Field label="Address" htmlFor={id('address')}>
              {text('address')}
            </Field>
            <Field label="Land Mark" htmlFor={id('landmark')}>
              {text('landmark')}
            </Field>
            {/* Country | State, City | Zip: shared cascade (State needs Country, City needs State) */}
            <LocationFields
              value={{ country: a.country || null, state: a.state, city: a.city }}
              onChange={(p) => onChange({ ...p, country: p.country ?? a.country })}
              extra={
                <Field label="Zip" htmlFor={id('zip')}>
                  {text('zip', { inputMode: 'numeric', maxLength: 6, transform: digits })}
                </Field>
              }
            />
          </div>
        )}
      </div>

      <DateWheelSheet
        isOpen={isDobOpen}
        title="Date Of Birth"
        value={a.dob}
        onClose={() => setIsDobOpen(false)}
        onApply={(dob) => {
          onChange({ dob });
          setIsDobOpen(false);
        }}
      />
    </section>
  );
};

/* -------------------------- Add family member sheet -------------------------- */

type NewMemberErrors = Partial<Record<'relationship' | 'name' | 'dob', string>>;

const AddFamilyMemberSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<FamilyMember, 'id'> & { phone: string }) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [relationship, setRelationship] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<NewMemberErrors>({});
  const [isDobOpen, setIsDobOpen] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Start blank every time the sheet opens
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setRelationship('');
      setName('');
      setDob('');
      setPhone('');
      setErrors({});
    }
  }

  const save = () => {
    const e: NewMemberErrors = {};
    if (!relationship) e.relationship = 'Relation Type is required.';
    if (!name.trim()) e.name = 'Full Name is required.';
    if (!dob) e.dob = 'Date of Birth is required.';
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ relationship, name: name.trim(), dob, phone });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <h2 className="text-base font-bold text-[#1E293B]">Add New Family Member</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
        <Field label="Relation Type" required error={errors.relationship}>
          <Dropdown
            size="md"
            ariaLabel="Relation Type"
            sheetTitle="Relation Type"
            value={relationship || null}
            placeholder="Select Relation"
            options={NEW_MEMBER_RELATIONS}
            onChange={(v) => {
              setRelationship(v);
              setErrors((p) => ({ ...p, relationship: undefined }));
            }}
          />
        </Field>
        <Field label="Full Name" required error={errors.name} htmlFor="new-member-name">
          <input
            id="new-member-name"
            type="text"
            autoComplete="off"
            maxLength={80}
            value={name}
            placeholder="Enter full name"
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: undefined }));
            }}
            className={inputCls(errors.name)}
          />
        </Field>
        <Field label="Date of Birth" required error={errors.dob}>
          <button
            type="button"
            onClick={() => setIsDobOpen(true)}
            className={`w-full h-11 px-3.5 bg-white border rounded-xl flex items-center gap-2 text-xs shadow-2xs cursor-pointer ${
              errors.dob ? 'border-rose-300' : 'border-slate-200'
            }`}
          >
            <CalendarDays className={`w-4 h-4 shrink-0 ${dob ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
            <span className={`flex-1 text-left tabular-nums ${dob ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'}`}>
              {dob ? formatDob(dob) : 'DD/MM/YYYY'}
            </span>
          </button>
        </Field>
        <Field label="Phone Number" htmlFor="new-member-phone">
          <input
            id="new-member-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            maxLength={10}
            value={phone}
            placeholder="Enter phone number"
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={inputCls()}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Save Member
        </button>
      </div>

      <DateWheelSheet
        isOpen={isDobOpen}
        title="Date of Birth"
        value={dob}
        onClose={() => setIsDobOpen(false)}
        onApply={(v) => {
          setDob(v);
          setErrors((p) => ({ ...p, dob: undefined }));
          setIsDobOpen(false);
        }}
      />
    </BottomSheet>
  );
};

/* --------------------------------- Screen --------------------------------- */

export const ProfFeesView: React.FC<{
  staffName: string;
  joiningDate: string;
  grossPackage: number;
  mainPackage: number;
  members: FamilyMember[];
  initialAccounts: ProfFeeAccount[];
  onCancel: () => void;
  onSave: (accounts: ProfFeeAccount[]) => void;
  /** A member added from "click here"; kept by the parent so it's there next time */
  onAddMember: (member: FamilyMember) => void;
}> = ({ staffName, joiningDate, grossPackage, mainPackage, members, initialAccounts, onCancel, onSave, onAddMember }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addedMemberId, setAddedMemberId] = useState<string | null>(null);
  /** Close "Member Added" and bring the new account's form into view */
  const closeMemberAdded = () => {
    const target = addedMemberId && document.getElementById(`pf-${addedMemberId}-vendorCode`);
    setAddedMemberId(null);
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  };
  const [accounts, setAccounts] = useState<ProfFeeAccount[]>(initialAccounts);
  const feesTotal = totalProfFees(accounts);
  const liveMain = Math.max(0, mainPackage - feesTotal);
  const [errors, setErrors] = useState<Record<string, AccountErrors>>({});
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedIds = accounts.map((a) => a.memberId);

  const applyMembers = (ids: string[]) => {
    setAccounts((prev) => [
      ...prev.filter((a) => ids.includes(a.memberId)),
      ...members.filter((m) => ids.includes(m.id) && !prev.some((a) => a.memberId === m.id)).map((m) => newAccount(m, vendorCode(members, m.id))),
    ]);
    setIsPickerOpen(false);
  };

  const patch = (memberId: string, p: Partial<ProfFeeAccount>) => {
    setAccounts((prev) => prev.map((a) => (a.memberId === memberId ? { ...a, ...p } : a)));
    // Clear errors for the fields just edited
    setErrors((prev) => {
      if (!prev[memberId]) return prev;
      const next = { ...prev[memberId] };
      for (const k of Object.keys(p)) delete next[k as keyof ProfFeeAccount];
      return { ...prev, [memberId]: next };
    });
  };

  const save = () => {
    const all = Object.fromEntries(accounts.map((a) => [a.memberId, validate(a)]));
    const firstBad = accounts.find((a) => Object.keys(all[a.memberId]).length);
    setErrors(all);
    if (firstBad) {
      const key = REQUIRED.find(([k]) => all[firstBad.memberId][k])?.[0];
      document.getElementById(`pf-${firstBad.memberId}-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSave(accounts);
  };

  /** Fills the empty fields on every account; picks the first member when none is selected */
  const quickFill = () => {
    const base = accounts.length ? accounts : members.slice(0, 1).map((m) => newAccount(m, vendorCode(members, m.id)));
    setAccounts(base.map((a, i) => quickFillAccount(a, i, staffName)));
    setErrors({});
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4 relative">
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="screen-title screen-title-tight text-base font-bold leading-tight">Prof. Fees</h1>
          <button
            type="button"
            onClick={quickFill}
            className="ml-auto h-8 px-2.5 rounded-full bg-indigo-50 text-[#4F46E5] text-[11px] font-semibold flex items-center gap-1 active:bg-indigo-100 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Quick Fill
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-3.5">
        {/* Staff summary */}
        {/* Gross stays fixed; professional fees come out of the main (salary) package, live as amounts are typed */}
        <dl className="grid grid-cols-2 gap-2.5 p-3 bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs text-xs">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
            <dt className="text-[10.5px] text-slate-500">Gross Actual Package</dt>
            <dd className="mt-0.5 font-bold text-[#1E293B] truncate tabular-nums">{inr(grossPackage)}</dd>
          </div>
          <div
            className={`px-3 py-2 rounded-xl border min-w-0 transition-colors ${
              feesTotal > 0 ? 'bg-[#EEF4FF] border-[#DBE6FE]' : 'bg-slate-50 border-slate-100'
            }`}
          >
            <dt className="text-[10.5px] text-slate-500">Main Staff Package</dt>
            <dd key={liveMain} className="mt-0.5 font-bold text-[#1E293B] truncate tabular-nums animate-in fade-in duration-300">
              {inr(liveMain)}
            </dd>
          </div>
          {feesTotal > 0 && (
            <p className="col-span-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-rose-50/60 border border-rose-100 text-[11px] animate-in fade-in duration-200">
              <span className="text-slate-600">Professional fees deducted</span>
              <span className="font-bold text-rose-600 tabular-nums">− {inr(feesTotal)}</span>
            </p>
          )}
        </dl>

        {/* Manage family members */}
        <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-3.5 space-y-3">
          <div>
            <h3 className="text-[13px] font-bold text-[#1E293B]">Manage Family Members</h3>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">Select family members to add professional fee accounts.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs shadow-2xs cursor-pointer active:bg-slate-50"
          >
            <Users className={`w-4 h-4 shrink-0 ${selectedIds.length ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
            <span className={`flex-1 text-left ${selectedIds.length ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-500'}`}>
              {selectedIds.length
                ? `${selectedIds.length} member${selectedIds.length > 1 ? 's' : ''} selected`
                : 'Select members'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* Someone not in the list yet */}
          <div className="flex items-center gap-2 text-[10.5px] font-semibold text-slate-400">
            <span className="flex-1 h-px bg-slate-100" />
            Not in the list?
            <span className="flex-1 h-px bg-slate-100" />
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="w-full h-11 rounded-xl border border-dashed border-[#2F68FE]/50 bg-blue-50/40 flex items-center justify-center gap-2 text-xs font-bold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Family Member
          </button>
        </section>

        {accounts.map((a, i) => (
          <AccountCard
            key={a.memberId}
            index={i}
            account={a}
            errors={errors[a.memberId] ?? {}}
            onChange={(p) => patch(a.memberId, p)}
            onRemove={() => setAccounts((prev) => prev.filter((x) => x.memberId !== a.memberId))}
          />
        ))}
      </div>

      <div className="shrink-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold active:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] cursor-pointer"
        >
          Save
        </button>
      </div>

      <MultiSelectSheet
        isOpen={isPickerOpen}
        title="Select members"
        options={members.map((m) => ({ value: m.id, label: m.name, badge: m.relationship }))}
        selected={selectedIds}
        searchPlaceholder="Search family members"
        onClose={() => setIsPickerOpen(false)}
        onApply={applyMembers}
      />

      <AddFamilyMemberSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={({ relationship, name, dob }) => {
          const member: FamilyMember = { id: `fm-${Date.now()}`, name, relationship, dob };
          onAddMember(member);
          // Select the new member straight away so their account form opens
          setAccounts((prev) => [...prev, newAccount(member, vendorCode(members, member.id))]);
          setIsAddOpen(false);
          setAddedMemberId(member.id);
        }}
      />

      <BottomSheet isOpen={Boolean(addedMemberId)} onClose={closeMemberAdded} maxHeight="max-h-[60%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="px-5 pt-3 pb-5 flex flex-col items-center text-center">
          <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </span>
          <h2 className="mt-3 text-base font-bold text-[#1E293B]">Member Added</h2>
          <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
            Family member added and fee account created. Please fill in the details below.
          </p>
        </div>
        <div className="p-4 pt-0 pb-8 shrink-0">
          <button
            type="button"
            onClick={closeMemberAdded}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-sm shadow-xs active:bg-[#1D4ED8] cursor-pointer"
          >
            OK
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
