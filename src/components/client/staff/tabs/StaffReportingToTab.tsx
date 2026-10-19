import React, { useEffect, useState } from 'react';
import { Mail, Pencil, Phone, UserPlus, UsersRound } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import { ChoiceTiles } from '../../../common/ChoiceTiles';
import { avatarTint, initialsOf } from '../../../home/celebrationUtils';
import type { MappedContact } from '../../data/clientStaffProfileData';
import { formatStaffDate } from '../../data/clientStaffData';
import { Card, DateField, EmptyCard, Pill, SheetHeader, TabTitle, TextField, useNotice } from './StaffTabParts';
import { useClientPermission } from '../../context/ClientPermissionContext';

interface StaffReportingToTabProps {
  staffName: string;
  contacts: MappedContact[];
  onChange: (next: MappedContact[]) => void;
}

type Draft = Pick<MappedContact, 'firstName' | 'lastName' | 'email' | 'phone' | 'birthDate' | 'status'>;
const EMPTY: Draft = { firstName: '', lastName: '', email: '', phone: '', birthDate: '', status: 'Active' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/** Desktop "Reporting To" tab (mapped_contacts.tpl): mapped client contacts, Map Contact + edit */
export const StaffReportingToTab: React.FC<StaffReportingToTabProps> = ({ staffName, contacts, onChange }) => {
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
      onChange([...contacts, { ...clean, id: `mc-${Date.now()}`, designation: 'Client Contact' }]);
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
          contacts.map((c, idx) => (
            <Card key={c.id} className="p-3.5">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${avatarTint(idx + 3)}`}>
                  {initialsOf(`${c.firstName} ${c.lastName}`)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-[#1E293B] truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-[11.5px] text-slate-500 truncate">{c.designation}</p>
                </div>
                <Pill tone={c.status === 'Active' ? 'green' : 'slate'}>{c.status}</Pill>
                {perm.edit && (
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  aria-label={`Edit ${c.firstName} ${c.lastName}`}
                  className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center active:bg-slate-50 shrink-0 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={c.phone ? `tel:${c.phone.replace(/[^\d+]/g, '')}` : undefined}
                  aria-disabled={!c.phone}
                  className={`h-9 px-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-[11.5px] font-semibold min-w-0 ${
                    c.phone ? 'text-slate-600 active:bg-slate-100' : 'text-slate-300 pointer-events-none'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-[#2F68FE] shrink-0" />
                  <span className="truncate tabular-nums">{c.phone || '--'}</span>
                </a>
                <a
                  href={`mailto:${c.email}`}
                  className="min-h-9 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-[11.5px] font-semibold text-slate-600 active:bg-slate-100 min-w-0"
                >
                  <Mail className="w-3.5 h-3.5 text-[#2F68FE] shrink-0" />
                  <span className="min-w-0 break-all">{c.email}</span>
                </a>
              </div>
              {c.birthDate && <p className="mt-2 text-[11px] text-slate-400">Birth Date: {formatStaffDate(c.birthDate)}</p>}
            </Card>
          ))
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
