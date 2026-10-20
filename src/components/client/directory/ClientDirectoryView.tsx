import React, { useEffect, useRef, useState } from 'react';
import { CalendarClock, Check, ChevronRight, Contact, Copy, Globe, GraduationCap, Megaphone, UserRoundX, UsersRound } from 'lucide-react';
import { SegmentedTabs } from '../../../design-system/components/SegmentedTabs';
import { ScreenHeader, Card, EmptyCard } from '../staff/tabs/StaffTabParts';
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

const PRODUCT_STYLE: Record<DirectoryProduct['id'], { icon: React.ElementType; tint: string }> = {
  offshoring: { icon: Globe, tint: 'bg-[#EFF6FF] text-[#2F68FE]' },
  cpe_b2b: { icon: UsersRound, tint: 'bg-[#EEF2FF] text-[#4F46E5]' },
  cpe_individual: { icon: GraduationCap, tint: 'bg-[#E8F8F0] text-[#10B981]' },
  digital_marketing_and_website: { icon: Megaphone, tint: 'bg-[#FEF8E7] text-[#D97706]' },
};

const ListSkeleton: React.FC<{ rows: number; product?: boolean }> = ({ rows, product }) => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading contacts">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-4 space-y-3">
        {product && (
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <StaffSkeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <StaffSkeleton className="w-28 h-3.5" />
              <StaffSkeleton className="w-40 h-3" />
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-32 h-3.5" />
            <StaffSkeleton className="w-44 h-3" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
          {[0, 1, 2].map((k) => (
            <div key={k} className="flex items-center gap-3 px-3 py-2.5">
              <StaffSkeleton className="w-16 h-3" />
              <StaffSkeleton className="flex-1 h-3" />
            </div>
          ))}
        </div>
        <StaffSkeleton className="w-full h-10 rounded-xl" />
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
    className={`w-8 h-8 -my-1 rounded-lg flex items-center justify-center shrink-0 cursor-pointer ${
      copied ? 'text-[#10B981]' : 'text-slate-400 active:bg-slate-100'
    }`}
  >
    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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
  const dt = 'w-[84px] shrink-0 text-[11px] font-semibold text-slate-500';
  const row = 'flex items-center gap-3 px-3 py-2.5 min-w-0';

  const identity = (
    <>
      <StaffAvatar name={c.name} tint={directoryTint(c.name)} />
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-bold text-[#1E293B] truncate">{c.name}</span>
        <span className="block text-[11px] text-slate-500 truncate">{c.designation}</span>
      </span>
    </>
  );

  return (
    <div className="space-y-3">
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`View ${c.name}'s contact information`}
          className="w-full rounded-xl flex items-center gap-3 text-left active:bg-slate-50 cursor-pointer"
        >
          {identity}
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
        </button>
      ) : (
        <div className="flex items-center gap-3">{identity}</div>
      )}

      <dl className="rounded-xl border border-slate-100 divide-y divide-slate-100 text-[12px]">
        <div className={row}>
          <dt className={dt}>Mail</dt>
          <dd className="flex-1 min-w-0 flex items-center gap-1">
            {c.email ? (
              <>
                <a href={`mailto:${c.email}`} className="flex-1 min-w-0 truncate text-[#2F68FE] select-text">
                  {c.email}
                </a>
                <CopyButton label="Mail" copied={copied === 'email'} onCopy={() => copy('email', c.email!)} />
              </>
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </dd>
        </div>
        <div className={row}>
          <dt className={dt}>{phoneLabel}</dt>
          <dd className="flex-1 min-w-0 flex items-center gap-1">
            {c.phone ? (
              <>
                <a href={telHref(c.phone)} className="flex-1 min-w-0 truncate text-[#1E293B] tabular-nums select-text">
                  {c.phone}
                </a>
                <CopyButton label={phoneLabel} copied={copied === 'phone'} onCopy={() => copy('phone', c.phone!)} />
              </>
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </dd>
        </div>
        <div className={row}>
          <dt className={dt}>Chat Channel</dt>
          <dd className="flex-1 min-w-0">
            {c.teamsUrl ? (
              <a
                href={c.teamsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Chat with ${c.name} on Microsoft Teams`}
                className="-my-1 -ml-1.5 inline-flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-lg text-[#4B53BC] font-semibold active:bg-[#EEF0FB]"
              >
                <TeamsIcon className="w-5 h-5" />
                Microsoft Teams
              </a>
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </dd>
        </div>
      </dl>

      {c.meetingUrl ? (
        <a
          href={c.meetingUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full h-10 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#DBEAFE]"
        >
          <CalendarClock className="w-4 h-4 shrink-0" />
          Schedule Meeting
        </a>
      ) : (
        <span className="w-full h-10 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5">
          <CalendarClock className="w-4 h-4 shrink-0" />
          No meeting link
        </span>
      )}
    </div>
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

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Directory" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <SegmentedTabs ariaLabel="Directory" options={DIRECTORY_TABS} value={tab} onChange={setTab} />
        </div>

        <div key={tab} className="px-4 mt-4 animate-in fade-in duration-200">
          {loading ? (
            <ListSkeleton rows={tab === 'primary' ? 2 : 3} product={tab === 'poc'} />
          ) : tab === 'primary' ? (
            primaryContacts.length === 0 ? (
              <EmptyCard icon={Contact} title="No Data Found" text="Your primary contacts haven't been assigned yet." />
            ) : (
              <div className="space-y-3">
                <p className="px-1 text-[11px] font-medium text-slate-400">
                  {primaryContacts.length} {primaryContacts.length === 1 ? 'contact' : 'contacts'}
                </p>
                {primaryContacts.map((c) => (
                  <Card key={c.id} className="p-4">
                    <ContactBody contact={c} onOpen={open(c)} />
                  </Card>
                ))}
              </div>
            )
          ) : products.length === 0 ? (
            <EmptyCard icon={Contact} title="No Data Found" text="No product contacts are available right now." />
          ) : (
            <div className="space-y-3">
              <p className="px-1 text-[11px] font-medium text-slate-400">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
              {products.map((p) => {
                const { icon: Icon, tint } = PRODUCT_STYLE[p.id];
                return (
                  <Card key={p.id} className="overflow-hidden">
                    <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/60 border-b border-slate-100">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-extrabold text-[#1E293B]">{p.product}</span>
                        <span className="block text-[11px] text-slate-500 truncate">{p.hint}</span>
                      </span>
                    </div>
                    <div className="p-4">
                      {p.poc ? (
                        <ContactBody contact={p.poc} onOpen={open(p.poc, p.product)} />
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                            <UserRoundX className="w-5 h-5" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] font-bold text-[#1E293B]">Not assigned yet</span>
                            <span className="block text-[11px] text-slate-500">Your Account Manager can help meanwhile.</span>
                          </span>
                          <button
                            type="button"
                            onClick={onOpenAccountManager}
                            className="h-9 px-3.5 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold active:bg-[#DBEAFE] shrink-0 cursor-pointer"
                          >
                            Contact
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
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
