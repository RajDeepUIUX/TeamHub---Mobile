import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCheck,
  CalendarCheck,
  CalendarDays,
  Megaphone,
  ChevronRight,
  BellOff,
  Zap,
  UsersRound,
  FileText,
  FileCog,
  Shuffle,
  UserPlus,
  ReceiptText,
  Video,
  ClipboardCheck,
  GraduationCap,
  Palmtree,
  Clock3,
} from 'lucide-react';
import { CLIENT_NOTIFICATION_CATEGORIES, ClientNotification, ClientNotificationCategory } from '../data/clientNotificationsData';

type Filter = 'All' | 'Unread' | ClientNotificationCategory;

const CATEGORY_META: Record<ClientNotificationCategory, { icon: React.ElementType; tint: string }> = {
  Announcements: { icon: Megaphone, tint: 'bg-sky-50 text-sky-600' },
  Attendance: { icon: CalendarCheck, tint: 'bg-amber-50 text-amber-600' },
  Leaves: { icon: CalendarDays, tint: 'bg-emerald-50 text-emerald-600' },
  'My Staff': { icon: UsersRound, tint: 'bg-blue-50 text-[#2F68FE]' },
  Resignation: { icon: FileText, tint: 'bg-rose-50 text-rose-500' },
  SOP: { icon: FileCog, tint: 'bg-violet-50 text-violet-600' },
  'Work Flexibility': { icon: Shuffle, tint: 'bg-teal-50 text-teal-600' },
  Hiring: { icon: UserPlus, tint: 'bg-indigo-50 text-indigo-600' },
  Invoices: { icon: ReceiptText, tint: 'bg-emerald-50 text-emerald-600' },
  Timesheets: { icon: Clock3, tint: 'bg-orange-50 text-orange-600' },
  Meetings: { icon: Video, tint: 'bg-cyan-50 text-cyan-600' },
  Assessments: { icon: ClipboardCheck, tint: 'bg-amber-50 text-amber-600' },
  Learning: { icon: GraduationCap, tint: 'bg-indigo-50 text-indigo-600' },
  Holidays: { icon: Palmtree, tint: 'bg-pink-50 text-pink-500' },
};

const relativeTime = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const dayGroup = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  return diffDays <= 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : 'Earlier';
};

interface ClientNotificationsViewProps {
  notifications: ClientNotification[];
  onBack: () => void;
  onOpen: (notification: ClientNotification) => void;
  onMarkAllRead: () => void;
}

/** Client copy of `notifications/NotificationsView` (same look as Manager, Client Hub categories) */
export const ClientNotificationsView: React.FC<ClientNotificationsViewProps> = ({ notifications, onBack, onOpen, onMarkAllRead }) => {
  const [filter, setFilter] = useState<Filter>('All');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const sorted = useMemo(() => [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [notifications]);

  // Only show category chips that have notifications, so the row stays short
  const chips: { id: Filter; count: number }[] = [
    { id: 'All', count: notifications.length },
    { id: 'Unread', count: unreadCount },
    ...CLIENT_NOTIFICATION_CATEGORIES.map((c) => ({ id: c as Filter, count: notifications.filter((n) => n.category === c).length })).filter(
      (c) => c.count > 0
    ),
  ];

  const visible = sorted.filter((n) => (filter === 'All' ? true : filter === 'Unread' ? !n.read : n.category === filter));
  const groups = (['Today', 'Yesterday', 'Earlier'] as const)
    .map((label) => ({ label, items: visible.filter((n) => dayGroup(n.createdAt) === label) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center justify-between h-14 px-4 relative">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div className="screen-title screen-title-tight">
              <h1 className="text-base font-bold leading-tight">Notifications</h1>
              <p className="text-[11px] text-slate-400">{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="h-8 px-2.5 rounded-full bg-blue-50 text-[#2F68FE] text-[11px] font-semibold flex items-center gap-1 active:bg-blue-100 cursor-pointer shrink-0"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3" role="tablist" aria-label="Filter notifications">
          {chips.map(({ id, count }) => {
            const isOn = filter === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isOn}
                onClick={() => setFilter(id)}
                className={`shrink-0 h-8 pl-3 pr-2 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  isOn ? 'bg-[#1E293B] border-[#1E293B] text-white' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                {id}
                <span
                  className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isOn ? 'bg-white/20 text-white' : id === 'Unread' && count > 0 ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-4">
        {groups.map((g) => (
          <section key={g.label}>
            <h2 className="px-1 mb-1.5 text-[12px] font-semibold text-slate-400">{g.label}</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden divide-y divide-slate-100">
              {g.items.map((n) => {
                const meta = CATEGORY_META[n.category];
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onOpen(n)}
                    className={`w-full flex items-start gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer ${
                      n.read ? 'bg-white active:bg-slate-50' : 'bg-blue-50/40 active:bg-blue-50'
                    }`}
                  >
                    <span className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.tint}`}>
                      <Icon className="w-[18px] h-[18px]" />
                      {!n.read && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2F68FE] ring-2 ring-white" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`text-[12.5px] leading-snug ${n.read ? 'font-semibold text-slate-700' : 'font-bold text-[#1E293B]'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 pt-0.5">{relativeTime(n.createdAt)}</span>
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-slate-500 leading-relaxed line-clamp-2">{n.body}</span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400">{n.category}</span>
                        {n.actionRequired && !n.read && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9.5px] font-bold">
                            <Zap className="w-2.5 h-2.5" />
                            Action needed
                          </span>
                        )}
                      </span>
                    </span>
                    {n.link && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 self-center" />}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {groups.length === 0 && (
          <div className="py-16 flex flex-col items-center text-center px-6">
            <span className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-2xs text-slate-400 flex items-center justify-center">
              <BellOff className="w-7 h-7" />
            </span>
            <p className="mt-4 text-sm font-bold text-[#1E293B]">
              {filter === 'Unread' ? "You're all caught up!" : filter === 'All' ? 'No notifications yet' : `No ${filter.toLowerCase()} notifications`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {filter === 'Unread' ? 'New updates will show up here.' : "We'll let you know when something needs your attention."}
            </p>
            {filter !== 'All' && (
              <button type="button" onClick={() => setFilter('All')} className="mt-3 text-xs font-semibold text-[#2F68FE] cursor-pointer">
                View all notifications
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
