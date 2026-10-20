import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, KeyRound, Loader2, Mail, Pencil, Phone, Plus, SearchX, UserRoundPlus } from 'lucide-react';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, Card, ChipRow, ConfirmSheet, EmptyCard, Pill, SearchField } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { isoOfDate } from '../data/clientInterviewsData';
import {
  CONTACT_LOAD_MS,
  ClientContact,
  ClientContactDraft,
  contactName,
  usernameFor,
} from '../data/clientContactsData';
import { ContactCompanyAddress, ContactFormView } from './ContactFormView';
import { ContactDetailSheet } from './ContactDetailSheet';

interface Props {
  /** Every firm contact, including the signed-in one (hidden here, shown in Company Profile) */
  contacts: ClientContact[];
  company: ContactCompanyAddress;
  /** Contacts live in ClientApp so Company Profile stays in sync and changes survive module switches */
  onChange: (next: ClientContact[]) => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

type Chip = 'All' | 'Portal Login' | 'No Login';
const CHIPS: readonly Chip[] = ['All', 'Portal Login', 'No Login'];

const PAGE_SIZE = 10;
const SEND_MS = 900;

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading contacts">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-32 h-3.5" />
            <StaffSkeleton className="w-24 h-3" />
          </div>
        </div>
        <StaffSkeleton className="w-full h-10 rounded-xl" />
      </div>
    ))}
  </div>
);

/**
 * Account › Client Contacts (desktop `contacts`): the firm's other contacts with Full Name / Email search, the
 * Edit form, Add New Contact and Send Partner Portal Credential (only while the contact has no username).
 * Desktop has no delete, so none is offered.
 */
export const ClientContactsView: React.FC<Props> = ({ contacts, company, onChange, onBack }) => {
  // `is_add` = Add New Contact; `is_edit` = Edit and Send Credentials; `is_view` = details
  const { add: canAdd, edit: canEdit } = useClientPermission('client-contacts');
  const [notice, showNotice] = useTimesheetNotice();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<Chip>('All');
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ editId: string | null } | null>(null);
  const [sendTargetId, setSendTargetId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), CONTACT_LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!form && listRef.current) listRef.current.scrollTop = listScroll.current;
  }, [form]);

  // Desktop: every contact except the signed-in one, ordered by id
  const all = useMemo(() => contacts.filter((c) => !c.isSelf), [contacts]);
  const tintOf = (id: string) => all.findIndex((c) => c.id === id);

  const term = query.trim().toLowerCase();
  const matchesTerm = (c: ClientContact) =>
    !term || [contactName(c), c.businessEmail, c.designation, c.username].join(' ').toLowerCase().includes(term);
  const inChip = (k: Chip, c: ClientContact) => k === 'All' || (k === 'Portal Login' ? Boolean(c.username) : !c.username);
  const base = all.filter(matchesTerm);
  const results = base.filter((c) => inChip(chip, c));
  const visible = results.slice(0, pages * PAGE_SIZE);
  const isFiltered = term.length > 0 || chip !== 'All';
  const pendingCount = all.filter((c) => !c.username).length;

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const clearAll = () => {
    setQuery('');
    setChip('All');
    reload();
  };

  const openForm = (editId: string | null) => {
    listScroll.current = listRef.current?.scrollTop ?? 0;
    setDetailId(null);
    setForm({ editId });
  };

  const credentialsFor = (c: ClientContact, taken: string[]) => ({
    username: usernameFor(c.firstName, c.lastName, taken),
    credentialsSentAt: isoOfDate(new Date()),
  });
  const usernames = contacts.map((c) => c.username).filter(Boolean);

  const save = (draft: ClientContactDraft) => {
    const { sendCredentials, ...fields } = draft;
    const editing = form?.editId ? contacts.find((c) => c.id === form.editId) : undefined;
    if (editing) {
      const sent = sendCredentials && !editing.username ? credentialsFor({ ...editing, ...fields }, usernames) : null;
      onChange(contacts.map((c) => (c.id === editing.id ? { ...c, ...fields, ...sent } : c)));
      showNotice(sent ? 'Contact updated and Partner Portal Credentials sent!' : 'Contact Updated Successfully!');
    } else {
      const created: ClientContact = {
        ...fields,
        id: `fc-${Date.now()}`,
        role: '',
        username: '',
        credentialsSentAt: null,
        createdAt: isoOfDate(new Date()),
      };
      onChange([...contacts, sendCredentials ? { ...created, ...credentialsFor(created, usernames) } : created]);
      showNotice(sendCredentials ? 'Contact added and Partner Portal Credentials sent!' : 'Contact Added Successfully!');
      setChip('All');
      setQuery('');
    }
    setForm(null);
    reload();
  };

  // Desktop `sendpartnerportalcredential`: generates the username, emails it, stores it on the contact
  const sendCredentials = () => {
    const target = contacts.find((c) => c.id === sendTargetId);
    setSendTargetId(null);
    if (!target) return;
    setSendingId(target.id);
    timer.current = setTimeout(() => {
      setSendingId(null);
      onChange(contacts.map((c) => (c.id === target.id ? { ...c, ...credentialsFor(c, usernames) } : c)));
      showNotice('Partner Portal Credentials Mail Send Successfully!');
    }, SEND_MS);
  };

  /* ---------- Add / Edit Contact ---------- */
  if (form) {
    const editing = form.editId ? contacts.find((c) => c.id === form.editId) : undefined;
    return (
      <ContactFormView
        key={form.editId ?? 'new'}
        contact={editing}
        others={contacts.filter((c) => c.id !== form.editId)}
        company={company}
        onBack={() => setForm(null)}
        onSave={save}
      />
    );
  }

  const detail = detailId ? contacts.find((c) => c.id === detailId) ?? null : null;
  const sendTarget = sendTargetId ? contacts.find((c) => c.id === sendTargetId) : undefined;

  const card = (c: ClientContact) => {
    const sending = sendingId === c.id;
    return (
      <li key={c.id}>
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setDetailId(c.id)}
            aria-label={`View ${contactName(c)}`}
            className="w-full p-3.5 flex items-center gap-3 text-left active:bg-slate-50 cursor-pointer"
          >
            <StaffAvatar name={contactName(c)} tint={tintOf(c.id)} />
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="text-[13.5px] font-bold text-[#1E293B] truncate">{contactName(c)}</span>
                {c.isPrimary && <Pill tone="green">Primary</Pill>}
              </span>
              <span className="block text-[11.5px] text-slate-500 truncate">{c.designation || 'No designation'}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
          </button>

          <div className="px-3.5 pb-3 space-y-1.5">
            <a href={`mailto:${c.businessEmail}`} className="flex items-center gap-2 text-[12px] text-slate-600 min-w-0 cursor-pointer">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{c.businessEmail}</span>
            </a>
            {c.mobile && (
              <a href={`tel:${c.mobile}`} className="flex items-center gap-2 text-[12px] text-slate-600 tabular-nums cursor-pointer">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {c.mobile}
              </a>
            )}
          </div>

          <div className="px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 min-w-0">
              {c.username ? (
                <>
                  <Pill tone="green">Portal Login</Pill>
                  <span className="text-[11px] text-slate-400 truncate">{c.username}</span>
                </>
              ) : (
                <Pill tone="amber">No login yet</Pill>
              )}
              {c.isAdmin && <Pill tone="indigo">Admin</Pill>}
            </span>
            {canEdit && (
              <span className="flex items-center gap-1.5 shrink-0">
                {!c.username && (
                  <button
                    type="button"
                    onClick={() => setSendTargetId(c.id)}
                    disabled={sending}
                    aria-label={`Send credentials to ${contactName(c)}`}
                    className="h-9 px-2.5 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center gap-1.5 active:bg-[#DBEAFE] disabled:cursor-wait cursor-pointer"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openForm(c.id)}
                  aria-label={`Edit ${contactName(c)}`}
                  className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center active:bg-slate-50 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </span>
            )}
          </div>
        </Card>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Client Contacts" onBack={onBack} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">

          <div className="flex items-center justify-between gap-3 min-h-9">
            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              {loading ? '' : `${results.length} contact${results.length === 1 ? '' : 's'}`}
              {!loading && pendingCount > 0 && !isFiltered && <span className="text-[#D97706]"> · {pendingCount} without login</span>}
            </span>
            {canAdd && (
              <button
                type="button"
                onClick={() => openForm(null)}
                className="h-9 px-3 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1.5 active:bg-[#1D4ED8] shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            )}
          </div>

          <div className="mt-2">
            <SearchField
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPages(1);
              }}
              placeholder="Search by name or email"
            />
          </div>

          <div className="mt-3">
            <ChipRow
              label="Portal login"
              options={CHIPS}
              value={chip}
              onChange={(c) => {
                if (c === chip) return;
                setChip(c);
                reload();
              }}
              counts={Object.fromEntries(CHIPS.map((k) => [k, base.filter((c) => inChip(k, c)).length]))}
            />
          </div>

          {isFiltered && !loading && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{chip === 'All' ? 'All contacts' : chip}</span>
              <button type="button" onClick={clearAll} className="text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="px-4 mt-3">
          {loading ? (
            <ListSkeleton />
          ) : all.length === 0 ? (
            <EmptyCard
              icon={UserRoundPlus}
              title="No Records Found"
              text="Contacts you add for your firm will show up here."
              action={
                canAdd ? (
                  <button type="button" onClick={() => openForm(null)} className="mt-4 h-10 px-4 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
                    Add New Contact
                  </button>
                ) : undefined
              }
            />
          ) : results.length === 0 ? (
            <EmptyCard
              icon={SearchX}
              title="No Records Found"
              text="Try a different name or email."
              action={
                isFiltered ? (
                  <button type="button" onClick={clearAll} className="mt-4 h-10 px-5 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer">
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-3">{visible.map(card)}</ul>
          )}

          {!loading && visible.length < results.length && (
            <button
              type="button"
              disabled={moreLoading}
              onClick={() => {
                setMoreLoading(true);
                timer.current = setTimeout(() => {
                  setPages((n) => n + 1);
                  setMoreLoading(false);
                }, CONTACT_LOAD_MS);
              }}
              className="mt-3 w-full h-11 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-slate-50 disabled:cursor-wait transition-colors cursor-pointer"
            >
              {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {moreLoading ? 'Loading…' : `Load More (${results.length - visible.length})`}
            </button>
          )}
        </div>
      </div>

      <ContactDetailSheet
        contact={detail}
        tint={detail ? tintOf(detail.id) : 0}
        canEdit={canEdit}
        sending={Boolean(detail && sendingId === detail.id)}
        onClose={() => setDetailId(null)}
        onEdit={(c) => openForm(c.id)}
        onSendCredentials={(c) => {
          setDetailId(null);
          setSendTargetId(c.id);
        }}
      />
      <ConfirmSheet
        isOpen={sendTarget !== undefined}
        title="Send Partner Portal Credentials?"
        message={`A username and temporary password will be emailed to ${sendTarget ? `${contactName(sendTarget)} (${sendTarget.businessEmail})` : 'this contact'}.`}
        confirmLabel="Send"
        onConfirm={sendCredentials}
        onClose={() => setSendTargetId(null)}
      />
    </div>
  );
};
