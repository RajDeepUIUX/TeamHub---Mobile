import React, { useEffect, useRef, useState } from 'react';
import {
  CalendarClock,
  Check,
  ChevronRight,
  Contact,
  Copy,
  Globe,
  GraduationCap,
  Mail,
  Megaphone,
  MessagesSquare,
  Phone,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { ScreenHeader, DesignVersion, EmptyCard } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import { initialsOf } from '../../home/celebrationUtils';
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

const DESIGN_VERSIONS = ['V1', 'V2'] as const;

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]';

const TAB_ICON: Record<DirectoryTab, React.ElementType> = { primary: Contact, poc: UsersRound };

const PRODUCT_STYLE: Record<DirectoryProduct['id'], { icon: React.ElementType; tint: string; band: string; accent: string }> = {
  offshoring: { icon: Globe, tint: 'bg-[#EFF6FF] text-[#2F68FE]', band: 'from-[#EFF6FF] to-white', accent: 'bg-[#2F68FE]' },
  cpe_b2b: { icon: UsersRound, tint: 'bg-[#EEF2FF] text-[#4F46E5]', band: 'from-[#EEF2FF] to-white', accent: 'bg-[#4F46E5]' },
  cpe_individual: { icon: GraduationCap, tint: 'bg-[#E8F8F0] text-[#10B981]', band: 'from-[#E8F8F0] to-white', accent: 'bg-[#10B981]' },
  digital_marketing_and_website: { icon: Megaphone, tint: 'bg-[#FEF8E7] text-[#D97706]', band: 'from-[#FEF8E7] to-white', accent: 'bg-[#F59E0B]' },
};

const ListSkeleton: React.FC<{ rows: number; product?: boolean; v2: boolean }> = ({ rows, product, v2 }) => (
  <div className={v2 ? 'space-y-3' : 'space-y-4'} aria-busy="true" aria-label="Loading contacts">
    {Array.from({ length: rows }, (_, i) =>
      v2 ? (
        <div key={i} className="bg-white border border-[#E6ECF5] rounded-xl overflow-hidden">
          {product && (
            <div className="px-3.5 py-2.5 flex items-center gap-2.5 border-b border-[#EEF2F7]">
              <StaffSkeleton className="w-7 h-7 rounded-lg" />
              <StaffSkeleton className="w-32 h-3" />
            </div>
          )}
          <div className="p-3.5 flex items-center gap-3">
            <StaffSkeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <StaffSkeleton className="w-32 h-3.5" />
              <StaffSkeleton className="w-44 h-3" />
            </div>
          </div>
          <div className="px-3.5 pb-3.5 grid grid-cols-2 gap-3">
            <StaffSkeleton className="col-span-2 h-8" />
            <StaffSkeleton className="h-8" />
            <StaffSkeleton className="h-8" />
          </div>
          <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-t border-[#EEF2F7] flex justify-end">
            <StaffSkeleton className="w-36 h-8" />
          </div>
        </div>
      ) : (
        <div key={i} className="bg-white border border-[#E6ECF5] rounded-[24px] p-4 space-y-3">
          {product && (
            <div className="flex items-center gap-3">
              <StaffSkeleton className="w-11 h-11 rounded-2xl" />
              <div className="flex-1 space-y-1.5">
                <StaffSkeleton className="w-28 h-3.5" />
                <StaffSkeleton className="w-40 h-3" />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <StaffSkeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <StaffSkeleton className="w-32 h-3.5" />
              <StaffSkeleton className="w-44 h-3" />
            </div>
          </div>
          {[0, 1, 2].map((k) => (
            <StaffSkeleton key={k} className="w-full h-12 rounded-2xl" />
          ))}
          <StaffSkeleton className="w-full h-11 rounded-full" />
        </div>
      ),
    )}
  </div>
);

/** Copy button after Mail and VOIP / Phone */
const CopyButton: React.FC<{ label: string; copied: boolean; onCopy: () => void; v2: boolean }> = ({ label, copied, onCopy, v2 }) => {
  const tone = copied
    ? v2
      ? 'border border-[#A7F3D0] bg-[#E8F8F0] text-[#10B981]'
      : 'bg-[#E8F8F0] text-[#10B981]'
    : v2
      ? 'border border-slate-200 bg-white text-slate-400 active:bg-slate-50'
      : 'bg-white text-slate-400 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.18)] active:bg-slate-50';
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
      title={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
      className={`w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer ${FOCUS} ${v2 ? 'rounded-lg' : 'rounded-full'} ${tone}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

/** Desktop row as a card: Staff Name + Designation, then Mail / VOIP / Chat Channel, and the Action (Schedule Meeting) */
const ContactBody: React.FC<{ contact: DirectoryContact; onOpen?: () => void; v2: boolean }> = ({ contact: c, onOpen, v2 }) => {
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
      <CopyButton label="Mail" copied={copied === 'email'} onCopy={() => copy('email', c.email!)} v2={v2} />
    </>
  ) : (
    empty
  );

  const phoneValue = c.phone ? (
    <>
      <a href={telHref(c.phone)} className={`flex-1 min-w-0 truncate text-[#1E293B] font-semibold tabular-nums select-text ${FOCUS}`}>
        {c.phone}
      </a>
      <CopyButton label={phoneLabel} copied={copied === 'phone'} onCopy={() => copy('phone', c.phone!)} v2={v2} />
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
      className={`min-w-0 inline-flex items-center gap-1.5 text-[#4B53BC] font-semibold ${FOCUS}`}
    >
      {v2 && <TeamsIcon className="w-4 h-4 shrink-0" />}
      <span className="truncate">Microsoft Teams</span>
    </a>
  ) : (
    empty
  );

  const meeting = (on: string, off: string) =>
    c.meetingUrl ? (
      <a href={c.meetingUrl} target="_blank" rel="noreferrer" className={`${on} ${FOCUS}`}>
        <CalendarClock className="w-4 h-4 shrink-0" />
        Schedule Meeting
      </a>
    ) : (
      <span className={off}>
        <CalendarClock className="w-4 h-4 shrink-0" />
        No meeting link
      </span>
    );

  const identityInner = v2 ? (
    <>
      <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-[12px] font-bold flex items-center justify-center shrink-0" aria-hidden="true">
        {initialsOf(c.name)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-bold text-[#1E293B] truncate">{c.name}</span>
        <span className="block text-[11px] text-slate-500 truncate">{c.designation}</span>
      </span>
    </>
  ) : (
    <>
      <span className="p-0.5 rounded-full bg-gradient-to-br from-[#2F68FE] to-[#4F46E5] shrink-0">
        <span className="block p-0.5 rounded-full bg-white">
          <StaffAvatar name={c.name} tint={directoryTint(c.name)} />
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-bold text-[#1E293B] truncate">{c.name}</span>
        <span className="mt-1 inline-flex max-w-full h-5 px-2 rounded-full bg-[#EFF6FF] text-[#2F68FE] text-[10.5px] font-semibold items-center">
          <span className="truncate">{c.designation}</span>
        </span>
      </span>
    </>
  );

  const identity = onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View ${c.name}'s contact information`}
      className={`w-full flex items-center gap-3 text-left active:bg-slate-50 cursor-pointer ${FOCUS} ${v2 ? 'rounded-lg' : 'rounded-2xl'}`}
    >
      {identityInner}
      {v2 ? (
        <span className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </span>
      ) : (
        <span className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </span>
      )}
    </button>
  ) : (
    <div className="flex items-center gap-3">{identityInner}</div>
  );

  if (v2) {
    const dt = 'flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400';
    const dd = 'mt-1 min-h-8 flex items-center gap-1.5 text-[12px] min-w-0';
    return (
      <>
        <div className="p-3.5">{identity}</div>
        <dl className="px-3.5 pb-3.5 grid grid-cols-2 gap-x-3 gap-y-3">
          <div className="col-span-2 min-w-0">
            <dt className={dt}>
              <Mail className="w-3 h-3" aria-hidden="true" /> Mail
            </dt>
            <dd className={dd}>{mailValue}</dd>
          </div>
          <div className="min-w-0">
            <dt className={dt}>
              <Phone className="w-3 h-3" aria-hidden="true" /> {phoneLabel}
            </dt>
            <dd className={dd}>{phoneValue}</dd>
          </div>
          <div className="min-w-0 pl-3 border-l border-[#EEF2F7]">
            <dt className={dt}>
              <MessagesSquare className="w-3 h-3" aria-hidden="true" /> Chat Channel
            </dt>
            <dd className={dd}>{chatValue}</dd>
          </div>
        </dl>
        <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-t border-[#EEF2F7] flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Action</span>
          {meeting(
            'h-8 px-3 rounded-lg bg-[#2F68FE] text-white text-[11.5px] font-bold flex items-center gap-1.5 active:bg-[#1D4ED8]',
            'h-8 px-3 rounded-lg border border-dashed border-slate-300 text-slate-400 text-[11.5px] font-bold flex items-center gap-1.5',
          )}
        </div>
      </>
    );
  }

  const tile = 'flex items-center gap-3 p-2.5 pr-2 rounded-2xl min-w-0';
  const tileIcon = 'w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.18)]';
  const lbl = 'block text-[10.5px] font-semibold text-slate-400';
  return (
    <div className="space-y-3">
      {identity}

      <dl className="space-y-2 text-[12px]">
        <div className={`${tile} bg-[#EFF6FF]`}>
          <span className={`${tileIcon} text-[#2F68FE]`}>
            <Mail className="w-4 h-4" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <dt className={lbl}>Mail</dt>
            <dd className="min-h-8 flex items-center gap-1 min-w-0">{mailValue}</dd>
          </div>
        </div>
        <div className={`${tile} bg-[#F8FAFC]`}>
          <span className={`${tileIcon} text-[#1E293B]`}>
            <Phone className="w-4 h-4" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <dt className={lbl}>{phoneLabel}</dt>
            <dd className="min-h-8 flex items-center gap-1 min-w-0">{phoneValue}</dd>
          </div>
        </div>
        <div className={`${tile} bg-[#EEF0FB]`}>
          <span className={tileIcon}>
            <TeamsIcon className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <dt className={lbl}>Chat Channel</dt>
            <dd className="min-h-8 flex items-center min-w-0">{chatValue}</dd>
          </div>
        </div>
      </dl>

      {meeting(
        'w-full h-11 rounded-full bg-gradient-to-r from-[#2F68FE] to-[#4F46E5] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_8px_16px_-8px_rgba(47,104,254,0.8)] active:opacity-90',
        'w-full h-11 rounded-full bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5',
      )}
    </div>
  );
};

export const ClientDirectoryView: React.FC<Props> = ({ primaryContacts, products, onOpenAccountManager, onBack }) => {
  const canView = useClientPermission('directories').view;
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
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

  /** V1: pill track with icons, active tab filled blue */
  const tabsV1 = (
    <div className="px-4 pt-4">
      <div className="p-1 rounded-full bg-white border border-[#E6ECF5] shadow-[0_6px_16px_-12px_rgba(15,23,42,0.35)] grid grid-cols-2 gap-1" role="tablist" aria-label="Directory">
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
              className={`h-10 px-2 rounded-full text-[12px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${FOCUS} ${
                on ? 'bg-[#2F68FE] text-white shadow-[0_6px_14px_-6px_rgba(47,104,254,0.8)]' : 'text-slate-500 active:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  /** V2: Manager profile tabs — icon + label underline tabs, active one in blue with a bar underneath */
  const tabsV2 = (
    <nav className="mt-1 border-b border-slate-200/80" aria-label="Directory">
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
              <Icon className="w-4 h-4" />
              {t.label}
              <span className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );

  const count = (n: number, one: string, many: string) =>
    v2 ? (
      <p className="px-0.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2F68FE]" aria-hidden="true" />
        {n} {n === 1 ? one : many}
      </p>
    ) : (
      <p className="px-1 text-[13px] font-bold text-[#1E293B]">
        {n} <span className="font-medium text-slate-400">{n === 1 ? one : many}</span>
      </p>
    );

  const cardShell = v2
    ? 'bg-white rounded-xl border border-[#E6ECF5] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_-12px_rgba(15,23,42,0.25)] overflow-hidden'
    : 'bg-white rounded-[24px] border border-[#E6ECF5] shadow-[0_10px_28px_-18px_rgba(15,23,42,0.3)] overflow-hidden';

  const notAssigned = (
    <div className={`flex items-center gap-3 ${v2 ? 'p-3.5' : ''}`}>
      <span
        className={`w-10 h-10 text-slate-400 flex items-center justify-center shrink-0 ${
          v2 ? 'rounded-xl border border-dashed border-slate-300 bg-white' : 'rounded-full bg-slate-100'
        }`}
      >
        <UserRoundX className="w-5 h-5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-bold text-[#1E293B]">Not assigned yet</span>
        <span className="block text-[11px] text-slate-500">Your Account Manager can help meanwhile.</span>
      </span>
      <button
        type="button"
        onClick={onOpenAccountManager}
        className={`h-9 px-3.5 text-xs font-bold shrink-0 cursor-pointer ${FOCUS} ${
          v2 ? 'rounded-lg border border-[#BFDBFE] bg-white text-[#2F68FE] active:bg-[#EFF6FF]' : 'rounded-full bg-[#2F68FE] text-white active:bg-[#1D4ED8]'
        }`}
      >
        Contact
      </button>
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Directory" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {v2 ? tabsV2 : tabsV1}

        <div key={tab} className="px-4 mt-4 animate-in fade-in duration-200">
          {loading ? (
            <ListSkeleton rows={tab === 'primary' ? 2 : 3} product={tab === 'poc'} v2={v2} />
          ) : tab === 'primary' ? (
            primaryContacts.length === 0 ? (
              <EmptyCard icon={Contact} title="No Data Found" text="Your primary contacts haven't been assigned yet." />
            ) : (
              <div className={v2 ? 'space-y-3' : 'space-y-4'}>
                {count(primaryContacts.length, 'contact', 'contacts')}
                {primaryContacts.map((c) => (
                  <section key={c.id} className={`${cardShell} ${v2 ? '' : 'p-4'}`}>
                    <ContactBody contact={c} onOpen={open(c)} v2={v2} />
                  </section>
                ))}
              </div>
            )
          ) : products.length === 0 ? (
            <EmptyCard icon={Contact} title="No Data Found" text="No product contacts are available right now." />
          ) : (
            <div className={v2 ? 'space-y-3' : 'space-y-4'}>
              {count(products.length, 'product', 'products')}
              {products.map((p) => {
                const { icon: Icon, tint, band, accent } = PRODUCT_STYLE[p.id];
                return v2 ? (
                  <section key={p.id} className={`${cardShell} relative`}>
                    <span className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`} aria-hidden="true" />
                    <div className="pl-4 pr-3.5 py-2.5 flex items-center gap-2.5 border-b border-[#EEF2F7]">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[12.5px] font-extrabold text-[#1E293B] truncate">{p.product}</span>
                        <span className="block text-[10.5px] text-slate-500 truncate">{p.hint}</span>
                      </span>
                    </div>
                    <div className="pl-0.5">{p.poc ? <ContactBody contact={p.poc} onOpen={open(p.poc, p.product)} v2 /> : notAssigned}</div>
                  </section>
                ) : (
                  <section key={p.id} className={cardShell}>
                    <div className={`px-4 pt-4 pb-3 flex items-center gap-3 bg-gradient-to-b ${band}`}>
                      <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-white shadow-[0_4px_10px_-6px_rgba(15,23,42,0.3)] ${tint.split(' ')[1]}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-extrabold text-[#1E293B]">{p.product}</span>
                        <span className="block text-[11px] text-slate-500 truncate">{p.hint}</span>
                      </span>
                    </div>
                    <div className="px-4 pb-4 pt-1">
                      {p.poc ? <ContactBody contact={p.poc} onOpen={open(p.poc, p.product)} v2={false} /> : notAssigned}
                    </div>
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
