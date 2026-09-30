import React, { useState } from 'react';
import { ArrowLeft, Search, X, Mail, Phone, Copy, Eye, Building2, UsersRound } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { CONTACT_DEPARTMENTS, RELEVANT_CONTACTS, RelevantContact } from '../../data/relevantContactsData';

interface RelevantContactsViewProps {
  onBack: () => void;
  onToast: (message: string) => void;
}

/** "Dr. Bhawna Chhabra" -> "BC" (titles don't count towards initials) */
const contactInitials = (name: string) => initialsOf(name.replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/i, ''));

const isExtension = (phone: string) => /^ext/i.test(phone);

/* ---------------------------- Contact info sheet --------------------------- */

const ContactInfoSheet: React.FC<{
  contact: RelevantContact | null;
  onClose: () => void;
  onToast: (message: string) => void;
}> = ({ contact, onClose, onToast }) => {
  // Keep the last contact while the sheet animates closed
  const [shown, setShown] = useState<RelevantContact | null>(contact);
  if (contact && contact !== shown) setShown(contact);
  const c = contact ?? shown;
  if (!c) return null;
  const avatarIdx = RELEVANT_CONTACTS.indexOf(c);

  const copy = (value: string, label: string) => {
    navigator.clipboard?.writeText(value).catch(() => undefined);
    onToast(`${label} copied.`);
  };

  const rows: { icon: React.ElementType; label: string; value?: string; href?: string }[] = [
    { icon: Mail, label: 'Email', value: c.email, href: `mailto:${c.email}` },
    {
      icon: Phone,
      label: c.phone && isExtension(c.phone) ? 'Phone (office extension)' : 'Phone',
      value: c.phone,
      href: c.phone && !isExtension(c.phone) ? `tel:${c.phone.replace(/\s/g, '')}` : undefined,
    },
  ];

  return (
    <BottomSheet isOpen={Boolean(contact)} onClose={onClose} maxHeight="max-h-[88%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <h2 className="text-[15px] font-bold text-[#1E293B]">Contact Information</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarTint(avatarIdx)}`}
          >
            {contactInitials(c.name)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1E293B] truncate">{c.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{c.department}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {rows.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-center gap-3 px-3.5 py-3">
              <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-[10.5px] font-semibold text-slate-400">{label}</span>
                {!value ? (
                  <span className="block text-xs text-slate-400">Not shared yet</span>
                ) : href ? (
                  <a href={href} className="block text-[13px] font-semibold text-[#2F68FE] truncate select-text">
                    {value}
                  </a>
                ) : (
                  <span className="block text-[13px] font-semibold text-[#1E293B] truncate select-text">{value}</span>
                )}
              </div>
              {value && (
                <button
                  type="button"
                  onClick={() => copy(value, label.split(' ')[0])}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
                  aria-label={`Copy ${label.toLowerCase()}`}
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <span className="block text-[11px] font-semibold text-slate-500">Reach out for</span>
          <ul className="space-y-1.5">
            {c.roles.map((r) => (
              <li key={r} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="shrink-0 px-5 pt-3 pb-5 border-t border-slate-100 grid grid-cols-2 gap-2.5">
        <a
          href={`mailto:${c.email}`}
          className="h-11 rounded-xl border border-slate-200 text-[13px] font-semibold text-[#1E293B] flex items-center justify-center gap-2 active:bg-slate-50"
        >
          <Mail className="w-4 h-4" />
          Email
        </a>
        {c.phone && !isExtension(c.phone) ? (
          <a
            href={`tel:${c.phone.replace(/\s/g, '')}`}
            className="h-11 rounded-xl bg-[#2F68FE] text-[13px] font-semibold text-white flex items-center justify-center gap-2 active:bg-blue-700"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
        ) : (
          <span className="h-11 rounded-xl bg-slate-100 text-[13px] font-semibold text-slate-400 flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            {c.phone ? 'Dial from desk' : 'No phone'}
          </span>
        )}
      </div>
    </BottomSheet>
  );
};

/* --------------------------------- Screen --------------------------------- */

export const RelevantContactsView: React.FC<RelevantContactsViewProps> = ({ onBack, onToast }) => {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All');
  const [viewing, setViewing] = useState<RelevantContact | null>(null);
  const q = query.trim().toLowerCase();

  const contacts = RELEVANT_CONTACTS.filter(
    (c) =>
      (department === 'All' || c.department === department) &&
      (!q || c.name.toLowerCase().includes(q) || c.roles.some((r) => r.toLowerCase().includes(q)))
  );
  const avatarIdxOf = (c: RelevantContact) => RELEVANT_CONTACTS.indexOf(c);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold ml-2">Relevant Contacts</h1>
        </div>
        <div className="px-4 pb-3 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or role..."
              className="w-full h-11 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
            {CONTACT_DEPARTMENTS.map((d) => {
              const active = department === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDepartment(d.id)}
                  className={`h-8 px-3.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#2F68FE] border-[#2F68FE] text-white'
                      : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2.5">
        {contacts.length > 0 && (
          <p className="px-1 text-[11px] font-medium text-slate-400">
            {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
          </p>
        )}

        {contacts.map((c) => {
          const extra = c.roles.length - 2;
          return (
            <article key={c.id} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setViewing(c)}
                className="w-full text-left p-3.5 flex items-start gap-3 active:bg-slate-50 cursor-pointer"
              >
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(avatarIdxOf(c))}`}
                >
                  {contactInitials(c.name)}
                </span>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div>
                    <h4 className="text-[13px] font-bold text-[#1E293B] truncate">{c.name}</h4>
                    <p className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{c.department}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.roles.slice(0, 2).map((r) => (
                      <span
                        key={r}
                        className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold max-w-full truncate"
                      >
                        {r}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10.5px] font-semibold">
                        +{extra} more
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="w-8 h-8 rounded-full bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0"
                  aria-label={`View ${c.name}'s contact information`}
                >
                  <Eye className="w-4 h-4" />
                </span>
              </button>
            </article>
          );
        })}

        {contacts.length === 0 && (
          <div className="py-12 flex flex-col items-center text-center">
            <span className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <UsersRound className="w-7 h-7" />
            </span>
            <p className="text-sm font-bold text-[#1E293B]">Nobody matches that yet</p>
            <p className="mt-0.5 text-xs text-slate-500 max-w-[240px]">
              Try a different name or topic, or switch to another department.
            </p>
            {(query || department !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setDepartment('All');
                }}
                className="mt-4 h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-[#2F68FE] active:bg-slate-50 cursor-pointer"
              >
                Show all contacts
              </button>
            )}
          </div>
        )}
      </div>

      <ContactInfoSheet
        contact={viewing}
        onClose={() => setViewing(null)}
        onToast={onToast}
      />
    </div>
  );
};
