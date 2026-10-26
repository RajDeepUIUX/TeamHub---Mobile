import React, { useEffect, useState } from 'react';
import { Mail, Pencil, Phone, UserPlus, UsersRound } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import { ChoiceTiles } from '../../../common/ChoiceTiles';
import { avatarTint, initialsOf } from '../../../home/celebrationUtils';
import type { MappedContact } from '../../data/clientStaffProfileData';
import { ACCENT, AccentCard, Card, DateField, EmptyCard, Pill, RowList, SheetHeader, TabTitle, TextField, useNotice } from './StaffTabParts';
import { useClientPermission } from '../../context/ClientPermissionContext';

interface StaffReportingToTabProps {
  staffName: string;
  contacts: MappedContact[];
  onChange: (next: MappedContact[]) => void;
  v2?: boolean;
}

type Draft = Pick<MappedContact, 'firstName' | 'lastName' | 'email' | 'phone' | 'birthDate' | 'status'>;
const EMPTY: Draft = { firstName: '', lastName: '', email: '', phone: '', birthDate: '', status: 'Active' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/** Desktop "Reporting To" tab (mapped_contacts.tpl): mapped client contacts, Map Contact + edit */
export const StaffReportingToTab: React.FC<StaffReportingToTabProps> = ({ staffName, contacts, onChange, v2 }) => {
  const perm = useClientPermission('my-staff');
  const [editing, setEditing] = useState<MappedContact | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [notice, showNotice] = useNotice();

  useEffect(() => {
    if (!editing) return;
    setDraft(editing === 'new' ? EMPTY : { ...editing });
    setTouched(false);
  }, [editing]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const editingId = editing && editing !== 'new' ? editing.id : null;
  const errors: Partial<Record<keyof Draft, string>> = {};
  if (!draft.firstName.trim()) errors.firstName = 'First name is required';
  if (!draft.lastName.trim()) errors.lastName = 'Last name is required';
  if (!draft.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(draft.email.trim())) errors.email = 'Enter a valid email';
  else if (contacts.some((c) => c.id !== editingId && c.email.toLowerCase() === draft.email.trim().toLowerCase()))
    errors.email = 'This contact is already mapped';
  if (draft.phone && !/^[+\d()\-\s]{7,20}$/.test(draft.phone)) errors.phone = 'Enter a valid phone number';
  const valid = Object.keys(errors).length === 0;

  const save = () => {
    setTouched(true);
    if (!valid) return;
    const clean = { ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim() };
    if (editingId) {
      onChange(contacts.map((c) => (c.id === editingId ? { ...c, ...clean } : c)));
      showNotice('Contact updated successfully.');
    } else {
      onChange([...contacts, { ...clean, id: `mc-${Date.now()}`, designation: '' }]);
      showNotice('Contact mapped successfully.');
    }
    setEditing(null);
  };

  const err = (k: keyof Draft) => (touched ? errors[k] : undefined);

  return (
    <>
      {notice}
      <TabTitle
        title="Mapped Contact"
        action={
          perm.add && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="h-9 px-3 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Map Contact
          </button>
          )
        }
      />

      <div className="mt-2.5 space-y-3">
        {contacts.length === 0 ? (
          <EmptyCard icon={UsersRound} title="No contacts mapped yet." text={`Map a contact ${staffName} reports to.`} />
        ) : (
          contacts.map((c, idx) => {
            const name = `${c.firstName} ${c.lastName}`.trim();
            if (v2) {
              const tel = c.phone ? `tel:${c.phone.replace(/[^\d+]/g, '')}` : undefined;
              return (
                <AccentCard key={c.id} accent={ACCENT[c.status === 'Active' ? 'green' : 'slate']} className="pl-4 pr-3.5 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[13px] font-bold shrink-0 ${avatarTint(idx + 3)}`}>
                      {initialsOf(name || c.email)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-400">Contact Name</p>
                      <p className="text-[14px] font-bold text-[#1E293B] leading-snug break-words">{name || '-'}</p>
                      <span className="mt-1 inline-flex">
                        <Pill tone={c.status === 'Active' ? 'green' : 'slate'}>{c.status}</Pill>
                      </span>
                    </div>
                    {perm.edit && (
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        aria-label={`Edit ${name || c.email}`}
                        className="w-9 h-9 rounded-full bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center active:bg-[#E0E7FF] shrink-0 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <RowList
                    className="mt-2.5 border-t border-slate-100"
                    rows={[
                      { label: 'Designation', value: c.designation || '-' },
                      { label: 'Phone No', value: c.phone || '-' },
                      { label: 'Email', value: <span className="break-all">{c.email}</span> },
                    ]}
                  />
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {tel ? (
                      <a href={tel} className="h-10 rounded-xl bg-[#E8F8F0] text-[#10B981] text-xs font-bold flex items-center justify-center gap-1.5 active:opacity-80">
                        <Phone className="w-4 h-4" /> Call
                      </a>
                    ) : (
                      <span className="h-10 rounded-xl bg-slate-50 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5" aria-hidden="true">
                        <Phone className="w-4 h-4" /> Call
                      </span>
                    )}
                    <a
                      href={`mailto:${c.email}`}
                      className="h-10 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:opacity-80"
                    >
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  </div>
                </AccentCard>
              );
            }
            return (
            <Card key={c.id} className="p-3.5">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${avatarTint(idx + 3)}`}>
                  {initialsOf(name || c.email)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400">Contact Name</p>
                  <p className="text-sm font-bold text-[#1E293B] truncate">{name || '-'}</p>
                </div>
                <Pill tone={c.status === 'Active' ? 'green' : 'slate'}>{c.status}</Pill>
              </div>
              <dl className="mt-3 rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100">
                {[
                  { label: 'Designation', value: c.designation, href: undefined, Icon: null },
                  { label: 'Phone No', value: c.phone, href: c.phone ? `tel:${c.phone.replace(/[^\d+]/g, '')}` : undefined, Icon: Phone },
                  { label: 'Email', value: c.email, href: `mailto:${c.email}`, Icon: Mail },
                ].map(({ label, value, href, Icon }) => (
                  <div key={label} className="px-3 py-2 flex items-center gap-3 min-w-0">
                    <dt className="w-[84px] shrink-0 text-[11px] text-slate-400">{label}</dt>
                    <dd className="flex-1 min-w-0 text-[12px] font-semibold text-[#1E293B]">
                      {value && href ? (
                        <a href={href} className="inline-flex max-w-full items-center gap-1.5 text-[#2F68FE] active:opacity-70">
                          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                          <span className="break-all tabular-nums">{value}</span>
                        </a>
                      ) : (
                        value || '-'
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              {perm.edit && (
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  aria-label={`Edit ${name || c.email}`}
                  className="mt-3 w-full h-10 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 active:bg-slate-50 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              )}
            </Card>
            );
          })
        )}
      </div>

      <BottomSheet isOpen={editing !== null} onClose={() => setEditing(null)} maxHeight="max-h-[90%]">
        <SheetHeader
          title={editingId ? 'Edit Contact Person' : 'Add Contact Person'}
          subtitle={`Reporting contact for ${staffName}`}
          onClose={() => setEditing(null)}
        />
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="First Name" required value={draft.firstName} onChange={(v) => set('firstName', v)} error={err('firstName')} />
            <TextField label="Last Name" required value={draft.lastName} onChange={(v) => set('lastName', v)} error={err('lastName')} />
          </div>
          <TextField label="Email" required type="email" value={draft.email} onChange={(v) => set('email', v)} error={err('email')} placeholder="name@firm.com" />
          <TextField label="Phone no" type="tel" value={draft.phone} onChange={(v) => set('phone', v)} error={err('phone')} placeholder="+1 (555) 000-0000" />
          <DateField label="Birth Date" value={draft.birthDate} onChange={(v) => set('birthDate', v)} max={today} />
          {editingId && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#1E293B]">Status</span>
              <ChoiceTiles multiple={false} options={['Active', 'Inactive']} selected={[draft.status]} onChange={(v) => set('status', v[0] as Draft['status'])} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
          <button type="button" onClick={() => setEditing(null)} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={touched && !valid}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {editingId ? 'Save Changes' : 'Map Contact'}
          </button>
        </div>
      </BottomSheet>
    </>
  );
};
