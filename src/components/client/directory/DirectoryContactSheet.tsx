import React, { useEffect, useRef, useState } from 'react';
import { CalendarClock, Check, ChevronRight, Copy, Headset, Mail, MessageSquareText, Phone } from 'lucide-react';
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
    { key: 'teams', icon: MessageSquareText, label: 'Chat Channel', value: c.teamsUrl ? 'Microsoft Teams' : undefined, href: c.teamsUrl, external: true },
  ];

  return (
    <BottomSheet isOpen={Boolean(contact)} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Contact Information" subtitle={product} onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <StaffAvatar name={c.name} tint={directoryTint(c.name)} size="lg" />
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#1E293B] truncate">{c.name}</p>
            <p className="text-[11.5px] text-slate-500">{c.designation}</p>
            {c.isAccountManager && (
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-[10.5px] font-bold">
                <Headset className="w-3 h-3" /> Your Account Manager
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {rows.map(({ key, icon: Icon, label, value, href, external, copyable }) => (
            <div key={key} className="flex items-center gap-3 px-3.5 py-3">
              <span className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-[10.5px] font-semibold text-slate-400">{label}</span>
                {!value ? (
                  <span className="block text-xs text-slate-400">Not shared yet</span>
                ) : (
                  <a
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noreferrer' : undefined}
                    className="block text-[13px] font-semibold text-[#2F68FE] truncate select-text"
                  >
                    {value}
                  </a>
                )}
              </div>
              {value && copyable && (
                <button
                  type="button"
                  onClick={() => copy(key, value)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                    copied === key ? 'text-[#10B981]' : 'text-slate-400 active:bg-slate-100'
                  }`}
                  aria-label={copied === key ? `${label} copied` : `Copy ${label.toLowerCase()}`}
                >
                  {copied === key ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          ))}
        </div>

        {c.isAccountManager && (
          <button
            type="button"
            onClick={onOpenAccountManager}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-left active:bg-slate-100 cursor-pointer"
          >
            <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
              <Headset className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-semibold text-[#1E293B]">More ways to reach</span>
              <span className="block text-[11px] text-slate-400 truncate">WhatsApp, text message, Slack</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
        )}
      </div>

      <div className="shrink-0 px-5 pt-3 pb-5 border-t border-slate-100 grid grid-cols-2 gap-2.5">
        {c.teamsUrl ? (
          <a
            href={c.teamsUrl}
            target="_blank"
            rel="noreferrer"
            className="h-12 rounded-xl border border-slate-200 text-xs font-bold text-[#1E293B] flex items-center justify-center gap-2 active:bg-slate-50"
          >
            <MessageSquareText className="w-4 h-4" /> Chat
          </a>
        ) : (
          <span className="h-12 rounded-xl bg-slate-100 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
            <MessageSquareText className="w-4 h-4" /> No chat
          </span>
        )}
        {c.meetingUrl ? (
          <a
            href={c.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="h-12 rounded-xl bg-[#2F68FE] text-xs font-bold text-white flex items-center justify-center gap-2 active:bg-[#1D4ED8]"
          >
            <CalendarClock className="w-4 h-4" /> Schedule Meeting
          </a>
        ) : (
          <span className="h-12 rounded-xl bg-slate-100 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
            <CalendarClock className="w-4 h-4" /> No meeting link
          </span>
        )}
      </div>
    </BottomSheet>
  );
};
