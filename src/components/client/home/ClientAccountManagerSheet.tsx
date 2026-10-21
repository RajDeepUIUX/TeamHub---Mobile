import React from 'react';
import { Mail, MessageCircle, MessageSquareText, Phone, X, ChevronRight } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { CLIENT_ACCOUNT_MANAGER } from '../data/clientDashboardData';

interface ClientAccountManagerSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Desktop sidebar "Account Manager" card → sheet: call / email first, then chat channels */
export const ClientAccountManagerSheet: React.FC<ClientAccountManagerSheetProps> = ({ isOpen, onClose }) => {
  const am = CLIENT_ACCOUNT_MANAGER;
  const digits = am.phone.replace(/[^\d+]/g, '');
  const channels = [
    { label: 'WhatsApp', value: am.whatsapp, href: `https://wa.me/${am.whatsapp.replace(/\D/g, '')}`, icon: MessageCircle, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Text message', value: am.phone, href: `sms:${digits}`, icon: MessageSquareText, tint: 'bg-sky-50 text-sky-600' },
    { label: 'Microsoft Teams', value: am.email, href: `https://teams.microsoft.com/l/chat/0/0?users=${am.email}`, icon: MessageSquareText, tint: 'bg-indigo-50 text-[#4F46E5]' },
    { label: 'Slack', value: am.slack, href: 'https://slack.com/', icon: MessageSquareText, tint: 'bg-rose-50 text-rose-500' },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
        <h2 className="text-base font-bold text-[#1E293B]">Account Manager</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-8">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarTint(1)}`}>
            {initialsOf(am.name)}
          </span>
          <div className="min-w-0">
            <span className="block text-sm font-bold text-[#1E293B]">{am.name}</span>
            <span className="block text-[11px] text-slate-500">{am.role}</span>
            <span className="block text-[11px] text-slate-400">{am.hours}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <a
            href={`tel:${digits}`}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#2558E6]"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
          <a
            href={`mailto:${am.email}`}
            className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-2 active:bg-blue-50"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        </div>

        <p className="mt-5 mb-2 text-[12px] font-semibold text-slate-400">Chat</p>
        <div className="bg-white border border-[#DCE3ED] rounded-2xl divide-y divide-slate-100">
          {channels.map(({ label, value, href, icon: Icon, tint }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 active:bg-slate-50">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
                <Icon className="w-4.5 h-4.5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold text-[#1E293B]">{label}</span>
                <span className="block text-[11px] text-slate-400 truncate">{value}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};
