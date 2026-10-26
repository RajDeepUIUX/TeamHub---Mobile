import React, { useEffect, useRef, useState } from 'react';
import { CalendarClock, Check, ChevronRight, Copy, Headset, Mail, Phone } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffAvatar } from '../staff/ClientStaffParts';
import { DirectoryContact, directoryTint, telHref } from '../data/clientDirectoryData';

interface Props {
  contact: DirectoryContact | null;
  /** Product name when opened from Product Specific POCs */
  product?: string;
  onClose: () => void;
  onOpenAccountManager: () => void;
}

/** Desktop "Chat Channel" column icon (Microsoft Teams) */
export const TeamsIcon: React.FC<{ className?: string }> = ({ className = 'w-4.5 h-4.5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="19.2" cy="5.6" r="2.2" fill="#5059C9" />
    <rect x="15.4" y="9" width="7.1" height="9" rx="3" fill="#5059C9" />
    <circle cx="12.2" cy="4.8" r="3" fill="#7B83EB" />
    <rect x="6.2" y="9" width="11" height="11.5" rx="3.5" fill="#7B83EB" />
    <rect x="1.5" y="6.5" width="11" height="11" rx="1.6" fill="#4B53BC" />
    <path d="M4.2 9.3h5.6v1.5H7.8v5.2H6.2v-5.2h-2z" fill="#FFFFFF" />
  </svg>
);

/** Contact details (Added by designer): every desktop column in one place + copy */
export const DirectoryContactSheet: React.FC<Props> = ({ contact, product, onClose, onOpenAccountManager }) => {
  // Keep the last contact while the sheet animates closed
  const [shown, setShown] = useState<DirectoryContact | null>(contact);
  if (contact && contact !== shown) setShown(contact);
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const c = contact ?? shown;
  if (!c) return null;

  const copy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => undefined);
    clearTimeout(timer.current);
    setCopied(key);
    timer.current = setTimeout(() => setCopied(null), 1600);
  };

  const rows: { key: string; icon: React.ElementType; label: string; value?: string; href?: string; external?: boolean; copyable?: boolean }[] = [
    { key: 'email', icon: Mail, label: 'Mail', value: c.email, href: c.email ? `mailto:${c.email}` : undefined, copyable: true },
    { key: 'phone', icon: Phone, label: c.phoneLabel === 'VOIP' ? 'VOIP' : 'Phone Number', value: c.phone, href: c.phone ? telHref(c.phone) : undefined, copyable: true },
    { key: 'teams', icon: TeamsIcon, label: 'Chat Channel', value: c.teamsUrl ? 'Microsoft Teams' : undefined, href: c.teamsUrl, external: true },
  ];

  const copyButton = (key: string, label: string, value: string) => (
    <button
      type="button"
      onClick={() => copy(key, value)}
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
        copied === key
          ? 'border border-emerald-200/50 bg-[#E8F8F0] text-[#10B981]'
          : 'border border-slate-200 bg-white text-slate-400 shadow-2xs active:bg-slate-50'
      }`}
      aria-label={copied === key ? `${label} copied` : `Copy ${label.toLowerCase()}`}
    >
      {copied === key ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );

  const link = (href: string | undefined, external: boolean | undefined, value: string, cls: string) => (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className={cls}>
      {value}
    </a>
  );

  const accountManagerBadge = c.isAccountManager && (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-bold">
      <Headset className="w-3 h-3" /> Your Account Manager
    </span>
  );

  const chatButton = c.teamsUrl ? (
    <a
      href={c.teamsUrl}
      target="_blank"
      rel="noreferrer"
      className="h-12 rounded-xl border border-[#2F68FE] bg-white text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-blue-50"
    >
      <TeamsIcon className="w-4.5 h-4.5" /> Chat
    </a>
  ) : (
    <span className="h-12 rounded-xl bg-slate-100 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
      <TeamsIcon className="w-4.5 h-4.5 grayscale opacity-50" /> No chat
    </span>
  );

  const meetingButton = c.meetingUrl ? (
    <a
      href={c.meetingUrl}
      target="_blank"
      rel="noreferrer"
      className="h-12 rounded-xl bg-[#2F68FE] text-xs font-bold text-white flex items-center justify-center gap-2 active:bg-[#1D4ED8] transition-colors"
    >
      <CalendarClock className="w-4 h-4" /> Schedule Meeting
    </a>
  ) : (
    <span className="h-12 rounded-xl bg-slate-100 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
      <CalendarClock className="w-4 h-4" /> No meeting link
    </span>
  );

  return (
    <BottomSheet isOpen={Boolean(contact)} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Contact Information" subtitle={product} onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="flex flex-col items-center text-center">
          <StaffAvatar name={c.name} tint={directoryTint(c.name)} size="lg" />
          <p className="mt-2.5 text-base font-bold text-[#1E293B]">{c.name}</p>
          <p className="text-xs text-slate-500">{c.designation}</p>
          {c.isAccountManager && <div className="mt-2">{accountManagerBadge}</div>}
        </div>

        <div className="space-y-2.5">
          {rows.map(({ key, icon: Icon, label, value, href, external, copyable }) => (
            <div key={key} className="flex items-center gap-3 p-3.5 bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs">
              <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-[11px] font-semibold text-slate-400">{label}</span>
                {!value ? (
                  <span className="block text-xs text-slate-400">Not shared yet</span>
                ) : (
                  link(href, external, value, 'block text-sm font-bold text-[#1E293B] truncate select-text')
                )}
              </div>
              {value && copyable && copyButton(key, label, value)}
            </div>
          ))}
        </div>

        {c.isAccountManager && (
          <button
            type="button"
            onClick={onOpenAccountManager}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-left active:bg-slate-100 cursor-pointer"
          >
            <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
              <Headset className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-semibold text-[#1E293B]">More ways to reach</span>
              <span className="block text-[11px] text-slate-400 truncate">WhatsApp, text message, Slack</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        )}
      </div>

      <div className="shrink-0 p-4 pb-6 border-t border-slate-100 grid grid-cols-2 gap-3">
        {chatButton}
        {meetingButton}
      </div>
    </BottomSheet>
  );
};
