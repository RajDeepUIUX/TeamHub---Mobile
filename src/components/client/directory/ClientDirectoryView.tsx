import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  Check,
  ChevronRight,
  Contact,
  Copy,
  Globe,
  GraduationCap,
  Mail,
  Megaphone,
  Phone,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { ScreenHeader, EmptyCard } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import { useClientPermission } from '../context/ClientPermissionContext';
import {
  DIRECTORY_TABS,
  DirectoryContact,
  DirectoryProduct,
  DirectoryTab,
  directoryTint,
  telHref,
} from '../data/clientDirectoryData';
import { DirectoryContactSheet, TeamsIcon } from './DirectoryContactSheet';

interface Props {
  primaryContacts: DirectoryContact[];
  products: DirectoryProduct[];
  onOpenAccountManager: () => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

/** Desktop loads each tab's table on first show */
const LOAD_MS = 450;

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]';

const TAB_ICON: Record<DirectoryTab, React.ElementType> = { primary: Contact, poc: UsersRound };

const PRODUCT_ICON: Record<DirectoryProduct['id'], React.ElementType> = {
  offshoring: Globe,
  cpe_b2b: UsersRound,
  cpe_individual: GraduationCap,
  digital_marketing_and_website: Megaphone,
};

/** Same card as Manager › Team Resignations: staff header, inset panel, bordered row, footer action */
const SHELL = 'bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs overflow-hidden';

const ListSkeleton: React.FC<{ rows: number; product?: boolean }> = ({ rows, product }) => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading contacts">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className={SHELL}>
        {product && (
          <div className="px-3.5 py-2.5 flex items-center gap-2.5 border-b border-slate-100">
            <StaffSkeleton className="w-8 h-8 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <StaffSkeleton className="w-28 h-3.5" />
              <StaffSkeleton className="w-40 h-3" />
            </div>
          </div>
        )}
        <div className="p-3.5 flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-32 h-3.5" />
            <StaffSkeleton className="w-44 h-3" />
          </div>
        </div>
        <StaffSkeleton className="mx-3.5 h-[82px] rounded-xl" />
        <div className="px-3.5 py-3 flex items-center justify-between">
          <StaffSkeleton className="w-28 h-6 rounded-md" />
          <StaffSkeleton className="w-36 h-9 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

/** Copy button after Mail and VOIP / Phone */
const CopyButton: React.FC<{ label: string; copied: boolean; onCopy: () => void }> = ({ label, copied, onCopy }) => (
  <button
    type="button"
    onClick={onCopy}
    aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
    title={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors ${FOCUS} ${
      copied ? 'bg-[#E8F8F0] text-[#10B981]' : 'text-slate-400 active:bg-slate-200/60 active:text-[#1E293B]'
    }`}
  >
    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
  </button>
);

/** Desktop row as a card: Staff Name + Designation, then Mail / VOIP / Chat Channel, and the Action (Schedule Meeting) */
const ContactBody: React.FC<{ contact: DirectoryContact; onOpen?: () => void }> = ({ contact: c, onOpen }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => undefined);
    clearTimeout(timer.current);
    setCopied(key);
    timer.current = setTimeout(() => setCopied(null), 1600);
  };

  const phoneLabel = c.phoneLabel === 'VOIP' ? 'VOIP' : 'Phone';
  const empty = <span className="text-slate-400">-</span>;

  const mailValue = c.email ? (
    <>
      <a href={`mailto:${c.email}`} className={`flex-1 min-w-0 truncate text-[#2F68FE] font-semibold select-text ${FOCUS}`}>
        {c.email}
      </a>
      <CopyButton label="Mail" copied={copied === 'email'} onCopy={() => copy('email', c.email!)} />
    </>
  ) : (
    empty
  );

  const phoneValue = c.phone ? (
    <>
      <a href={telHref(c.phone)} className={`flex-1 min-w-0 truncate text-[#1E293B] font-semibold tabular-nums select-text ${FOCUS}`}>
        {c.phone}
      </a>
      <CopyButton label={phoneLabel} copied={copied === 'phone'} onCopy={() => copy('phone', c.phone!)} />
    </>
  ) : (
    empty
  );

  const chatValue = c.teamsUrl ? (
    <a
      href={c.teamsUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Chat with ${c.name} on Microsoft Teams`}
      className={`min-w-0 inline-flex items-center gap-1.5 text-[#2F68FE] text-xs font-semibold active:text-[#1D4ED8] ${FOCUS}`}
    >
      <TeamsIcon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">Microsoft Teams</span>
      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    </a>
  ) : (
    empty
  );

  const meeting = c.meetingUrl ? (
    <a
      href={c.meetingUrl}
      target="_blank"
      rel="noreferrer"
      className={`h-9 px-3.5 rounded-xl bg-[#2F68FE] text-white text-[11px] font-bold flex items-center gap-1.5 active:bg-[#1D4ED8] transition-colors ${FOCUS}`}
    >
      <CalendarClock className="w-3.5 h-3.5 shrink-0" />
      Schedule Meeting
    </a>
  ) : (
    <span className="h-9 px-3.5 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
      <CalendarClock className="w-3.5 h-3.5 shrink-0" />
      No meeting link
    </span>
  );

  const identityInner = (
    <>
      <StaffAvatar name={c.name} tint={directoryTint(c.name)} />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-[#1E293B] truncate">{c.name}</span>
        <span className="block text-[11px] text-slate-400 truncate">{c.designation}</span>
      </span>
    </>
  );

  /** Staff header */
  const identity = onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View ${c.name}'s contact information`}
      className={`w-full p-3.5 flex items-center gap-3 text-left active:bg-slate-50 cursor-pointer ${FOCUS}`}
    >
      {identityInner}
      <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </span>
    </button>
  ) : (
    <div className="p-3.5 flex items-center gap-3">{identityInner}</div>
  );

  const fieldRow = 'flex items-center gap-2.5 px-2.5 py-1.5 min-w-0';
  const fieldIcon = 'w-7 h-7 rounded-lg bg-white border border-slate-100 text-slate-400 flex items-center justify-center shrink-0';
  const fieldValue = 'flex-1 min-w-0 flex items-center gap-1 text-xs';
  return (
    <>
      {identity}

      {/* Mail / Phone: icon rows, label kept for screen readers */}
      <dl className="mx-3.5 rounded-xl bg-slate-50/80 border border-slate-100 divide-y divide-slate-100">
        <div className={fieldRow} title="Mail">
          <span className={fieldIcon} aria-hidden="true">
            <Mail className="w-3.5 h-3.5" />
          </span>
          <dt className="sr-only">Mail</dt>
          <dd className={fieldValue}>{mailValue}</dd>
        </div>
        <div className={fieldRow} title={phoneLabel}>
          <span className={fieldIcon} aria-hidden="true">
            <Phone className="w-3.5 h-3.5" />
          </span>
          <dt className="sr-only">{phoneLabel}</dt>
          <dd className={fieldValue}>{phoneValue}</dd>
        </div>
      </dl>

      {/* Footer: chat channel + action */}
      <div className="px-3.5 py-3 flex items-center justify-between gap-2 min-w-0">
        <span className="min-w-0 flex items-center text-[11px]">
          <span className="sr-only">Chat Channel: </span>
          {chatValue}
        </span>
        <span className="shrink-0">{meeting}</span>
      </div>
    </>
  );
};

export const ClientDirectoryView: React.FC<Props> = ({ primaryContacts, products, onOpenAccountManager, onBack }) => {
  const canView = useClientPermission('directories').view;
  const [tab, setTab] = useState<DirectoryTab>('primary');
  const [loaded, setLoaded] = useState<DirectoryTab[]>([]);
  // Last opened contact stays set so the sheet keeps its content while animating closed
  const [viewing, setViewing] = useState<{ contact: DirectoryContact; product?: string } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const loading = !loaded.includes(tab);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoaded((prev) => [...prev, tab]), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading, tab]);

  const open = (contact: DirectoryContact, product?: string) =>
    canView
      ? () => {
          setViewing({ contact, product });
          setSheetOpen(true);
        }
      : undefined;

  const count = (n: number, one: string, many: string) => (
    <p className="px-1 text-sm font-bold text-[#1E293B]">
      {n} <span className="font-medium text-slate-400">{n === 1 ? one : many}</span>
    </p>
  );

  const notAssigned = (
    <div className="flex items-center gap-3 p-3.5">
      <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
        <UserRoundX className="w-5 h-5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-bold text-[#1E293B]">Not assigned yet</span>
        <span className="block text-[11px] text-slate-500">Your Account Manager can help meanwhile.</span>
      </span>
      <button
        type="button"
        onClick={onOpenAccountManager}
        className={`h-9 px-3.5 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shrink-0 cursor-pointer active:bg-[#1D4ED8] ${FOCUS}`}
      >
        Contact
      </button>
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Directory" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <nav className="border-b border-slate-200/80" aria-label="Directory">
          <div className="flex gap-1 overflow-x-auto no-scrollbar px-2" role="tablist">
            {DIRECTORY_TABS.map((t) => {
              const on = t.id === tab;
              const Icon = TAB_ICON[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t.id)}
                  className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${FOCUS} ${
                    on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {t.label}
                  <span
                    className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${
                      on ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </nav>

        <div key={tab} className="px-4 mt-4 animate-in fade-in duration-200">
          {loading ? (
            <ListSkeleton rows={tab === 'primary' ? 2 : 3} product={tab === 'poc'} />
          ) : tab === 'primary' ? (
            primaryContacts.length === 0 ? (
              <EmptyCard icon={Contact} title="No Data Found" text="Your primary contacts haven't been assigned yet." />
            ) : (
              <div className="space-y-3">
                {primaryContacts.map((c) => (
                  <section key={c.id} className={SHELL}>
                    <ContactBody contact={c} onOpen={open(c)} />
                  </section>
                ))}
              </div>
            )
          ) : products.length === 0 ? (
            <EmptyCard icon={Contact} title="No Data Found" text="No product contacts are available right now." />
          ) : (
            <div className="space-y-3">
              {products.map((p) => {
                const Icon = PRODUCT_ICON[p.id];
                return (
                  <section key={p.id} className={SHELL}>
                    <div className="px-3.5 py-2.5 flex items-center gap-2.5 border-b border-slate-100">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[#EEF2FF] text-[#2F68FE]">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-[#1E293B] truncate">{p.product}</span>
                        <span className="block text-[11px] text-slate-500 truncate">{p.hint}</span>
                      </span>
                    </div>
                    {p.poc ? <ContactBody contact={p.poc} onOpen={open(p.poc, p.product)} /> : notAssigned}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <DirectoryContactSheet
        contact={sheetOpen ? viewing?.contact ?? null : null}
        product={viewing?.product}
        onClose={() => setSheetOpen(false)}
        onOpenAccountManager={() => {
          setSheetOpen(false);
          onOpenAccountManager();
        }}
      />
    </div>
  );
};
