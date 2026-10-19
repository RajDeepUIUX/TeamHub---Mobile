import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  ChevronRight,
  Contact,
  Globe,
  GraduationCap,
  Headset,
  Mail,
  Megaphone,
  MessageSquareText,
  Phone,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { SegmentedTabs } from '../../../design-system/components/SegmentedTabs';
import { Card, EmptyCard } from '../staff/tabs/StaffTabParts';
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
import { DirectoryContactSheet } from './DirectoryContactSheet';

interface Props {
  primaryContacts: DirectoryContact[];
  products: DirectoryProduct[];
  onOpenAccountManager: () => void;
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
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3">
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
        <StaffSkeleton className="w-full h-3" />
        <div className="flex gap-2">
          {[0, 1, 2].map((k) => (
            <StaffSkeleton key={k} className="w-11 h-11 rounded-xl" />
          ))}
          <StaffSkeleton className="flex-1 h-11 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

/** Square icon action (Mail / VOIP / Chat Channel); disabled when the desktop cell is "-" */
const IconAction: React.FC<{ icon: React.ElementType; label: string; href?: string; external?: boolean }> = ({
  icon: Icon,
  label,
  href,
  external,
}) =>
  href ? (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      aria-label={label}
      title={label}
      className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-[#2F68FE] flex items-center justify-center shrink-0 active:bg-[#EFF6FF] active:border-[#BFDBFE]"
    >
      <Icon className="w-4.5 h-4.5" />
    </a>
  ) : (
    <span
      role="img"
      aria-label={`${label} not available`}
      title={`${label} not available`}
      className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center shrink-0"
    >
      <Icon className="w-4.5 h-4.5" />
    </span>
  );

/** Person block shared by both tabs: identity, mail + phone lines, actions, Schedule Meeting */
const ContactBody: React.FC<{ contact: DirectoryContact; onOpen?: () => void }> = ({ contact: c, onOpen }) => {
  const identity = (
    <>
      <StaffAvatar name={c.name} tint={directoryTint(c.name)} />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13px] font-bold text-[#1E293B] truncate">{c.name}</span>
          {c.isAccountManager && (
            <span className="px-1.5 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-[9.5px] font-bold whitespace-nowrap shrink-0">
              Account Manager
            </span>
          )}
        </span>
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

      <dl className="space-y-1.5 text-[11.5px]">
        <div className="flex items-center gap-2 min-w-0">
          <dt className="shrink-0 text-slate-400">
            <Mail className="w-3.5 h-3.5" aria-label="Mail" />
          </dt>
          <dd className={`truncate select-text ${c.email ? 'text-slate-600' : 'text-slate-400'}`}>{c.email ?? 'Not shared yet'}</dd>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <dt className="shrink-0 text-slate-400">
            <Phone className="w-3.5 h-3.5" aria-label={c.phoneLabel} />
          </dt>
          <dd className={`truncate select-text tabular-nums ${c.phone ? 'text-slate-600' : 'text-slate-400'}`}>
            {c.phone ? (
              <>
                {c.phoneLabel === 'VOIP' && <span className="mr-1 text-[10px] font-bold text-slate-400">VOIP</span>}
                {c.phone}
              </>
            ) : (
              'Not shared yet'
            )}
          </dd>
        </div>
      </dl>

      <div className="flex gap-2">
        <IconAction icon={Mail} label={`Email ${c.name}`} href={c.email ? `mailto:${c.email}` : undefined} />
        <IconAction icon={Phone} label={`Call ${c.name}`} href={c.phone ? telHref(c.phone) : undefined} />
        <IconAction icon={MessageSquareText} label={`Chat with ${c.name} on Teams`} href={c.teamsUrl} external />
        {c.meetingUrl ? (
          <a
            href={c.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-0 h-11 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#DBEAFE]"
          >
            <CalendarClock className="w-4 h-4 shrink-0" />
            <span className="truncate">Schedule Meeting</span>
          </a>
        ) : (
          <span className="flex-1 min-w-0 h-11 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5">
            <CalendarClock className="w-4 h-4 shrink-0" />
            <span className="truncate">No meeting link</span>
          </span>
        )}
      </div>
    </div>
  );
};

export const ClientDirectoryView: React.FC<Props> = ({ primaryContacts, products, onOpenAccountManager }) => {
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

  const tabLabel = DIRECTORY_TABS.find((t) => t.id === tab)?.label;
  const open = (contact: DirectoryContact, product?: string) =>
    canView
      ? () => {
          setViewing({ contact, product });
          setSheetOpen(true);
        }
      : undefined;

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Directory <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">{tabLabel}</span>
          </p>
          <h1 className="mt-0.5 mb-1.5 text-xl font-extrabold leading-tight">Directory</h1>
          <p className="mt-1 text-[11.5px] text-slate-500">Email, call, chat or book a meeting with your Entigrity team.</p>
          <div className="mt-3">
            <SegmentedTabs ariaLabel="Directory" options={DIRECTORY_TABS} value={tab} onChange={setTab} />
          </div>
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
                  <Card key={c.id} className={`p-4 ${c.isAccountManager ? 'border-[#BFDBFE]' : ''}`}>
                    <ContactBody contact={c} onOpen={open(c)} />
                  </Card>
                ))}
                <button
                  type="button"
                  onClick={() => setTab('poc')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-dashed border-slate-200 text-left active:bg-slate-50 cursor-pointer"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Headset className="w-5 h-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold text-[#1E293B]">Question about a product?</span>
                    <span className="block text-[11px] text-slate-500">Offshoring, CPE or Digital Marketing experts</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
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
