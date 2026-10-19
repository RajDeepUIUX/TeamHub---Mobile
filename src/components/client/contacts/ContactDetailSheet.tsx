import React, { useState } from 'react';
import { KeyRound, Loader2, Mail, Pencil, Phone } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { Pill, SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffAvatar } from '../staff/ClientStaffParts';
import { ValueGrid } from '../profile/ProfileParts';
import { ClientContact, contactName, formatContactDate } from '../data/clientContactsData';

interface Props {
  contact: ClientContact | null;
  tint: number;
  canEdit: boolean;
  sending: boolean;
  onClose: () => void;
  onEdit: (c: ClientContact) => void;
  onSendCredentials: (c: ClientContact) => void;
}

const yesNo = (v: boolean) => (v ? 'Yes' : 'No');

/** Contact details (Added by designer): every field the desktop edit form holds, read-only, with Edit / Send Credentials */
export const ContactDetailSheet: React.FC<Props> = ({ contact, tint, canEdit, sending, onClose, onEdit, onSendCredentials }) => {
  // Keep the last contact while the sheet animates closed
  const [shown, setShown] = useState<ClientContact | null>(contact);
  if (contact && contact !== shown) setShown(contact);
  const c = contact ?? shown;
  if (!c) return null;

  const address = [c.address, c.city, c.state, c.zipCode, c.country].filter(Boolean).join(', ');

  return (
    <BottomSheet isOpen={Boolean(contact)} onClose={onClose} maxHeight="max-h-[90%]">
      <SheetHeader title="Contact Details" onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <StaffAvatar name={contactName(c)} tint={tint} size="lg" />
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#1E293B] truncate">
              {c.title && `${c.title} `}
              {contactName(c)}
            </p>
            <p className="text-[11.5px] text-slate-500 truncate">{c.designation || 'No designation'}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {c.isPrimary && <Pill tone="green">Primary</Pill>}
              {c.isAdmin && <Pill tone="indigo">Portal Admin</Pill>}
              {c.decisionMaker && <Pill tone="amber">Decision Maker</Pill>}
              <Pill tone="slate">{c.role || 'Manager'}</Pill>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={`mailto:${c.businessEmail}`}
            className="h-11 rounded-xl border border-slate-200 text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-slate-50 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
          {c.mobile ? (
            <a
              href={`tel:${c.mobile}`}
              className="h-11 rounded-xl border border-slate-200 text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-slate-50 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          ) : (
            <span className="h-11 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5">
              <Phone className="w-4 h-4" />
              No mobile
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 p-4">
          <p className="mb-3 text-[11px] font-bold tracking-wide text-slate-400 uppercase">Portal Login</p>
          {c.username ? (
            <ValueGrid
              rows={[
                { label: 'Username', value: c.username },
                { label: 'Credentials sent', value: c.credentialsSentAt ? formatContactDate(c.credentialsSentAt) : '' },
              ]}
            />
          ) : (
            <p className="text-[12px] text-slate-500 leading-snug">No portal login yet. Send credentials to let this contact sign in.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 p-4">
          <p className="mb-3 text-[11px] font-bold tracking-wide text-slate-400 uppercase">Contact</p>
          <ValueGrid
            rows={[
              { label: 'Business Email', value: c.businessEmail, wide: true },
              { label: 'Personal Email', value: c.personalEmail, wide: true },
              { label: 'Second Email', value: c.secondEmail, wide: true },
              { label: 'Mobile', value: c.mobile },
              { label: 'Direct Phone', value: c.directPhone },
              { label: 'Phone', value: c.phone },
              { label: 'Ext', value: c.ext },
              { label: 'Address', value: address, wide: true },
            ]}
          />
        </div>

        <div className="rounded-2xl border border-slate-100 p-4">
          <p className="mb-3 text-[11px] font-bold tracking-wide text-slate-400 uppercase">More</p>
          <ValueGrid
            rows={[
              { label: 'Date of Birth', value: c.birthDate ? formatContactDate(c.birthDate) : '' },
              { label: 'Qualification', value: c.qualification.join(', ') },
              { label: 'LinkedIn', value: c.linkedin, wide: true },
              { label: 'Facebook', value: c.facebook, wide: true },
              { label: 'Instagram', value: c.instagram, wide: true },
              { label: 'Twitter', value: c.twitter, wide: true },
              { label: 'Skype ID', value: c.skype },
              { label: 'Added On', value: formatContactDate(c.createdAt) },
              { label: 'Notes', value: c.notes, wide: true },
            ]}
          />
        </div>

        <div className="rounded-2xl border border-slate-100 p-4">
          <p className="mb-3 text-[11px] font-bold tracking-wide text-slate-400 uppercase">Preferences</p>
          <ValueGrid
            rows={[
              { label: 'Invoices', value: yesNo(c.invoices) },
              { label: 'Timesheet', value: yesNo(c.timesheet) },
              { label: 'Reporting Manager', value: yesNo(c.reportingManager) },
              { label: 'Opt Out (mass emails)', value: yesNo(c.optOutEmails) },
              { label: 'iMessage', value: yesNo(c.iMessage) },
            ]}
          />
        </div>
      </div>

      {canEdit && (
        <div className={`grid gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0 ${c.username ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!c.username && (
            <button
              type="button"
              onClick={() => onSendCredentials(c)}
              disabled={sending}
              className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white flex items-center justify-center gap-2 active:bg-blue-50 disabled:opacity-60 disabled:cursor-wait cursor-pointer"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send Credentials'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(c)}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            Edit Contact
          </button>
        </div>
      )}
    </BottomSheet>
  );
};
