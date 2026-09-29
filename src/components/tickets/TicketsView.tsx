import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  X,
  Building2,
  CalendarClock,
  Hash,
  Flag,
  Inbox,
  Eye,
  MessageSquare,
  RotateCcw,
  UserRound,
} from 'lucide-react';
import { Ticket, TicketStatus } from '../../types/tickets';
import {
  PRIORITY_STYLES,
  STATUS_STYLES,
  formatTicketDate,
  formatTicketDateTime,
  htmlToText,
} from '../../data/ticketsData';
import { TicketKPICard, TicketSummarySheet } from './TicketSummary';
import {
  FilterIconButton,
  FilterSelection,
  TeamFilterSheet,
  activeFilterCount,
  matchesFilters,
} from '../common/TeamFilterSheet';
import { TICKET_DEPARTMENTS, TICKET_PRIORITIES, TICKET_STATUSES } from '../../data/ticketsData';
import { BottomSheet } from '../common/BottomSheet';
import { TicketCommentsSheet, ReopenTicketSheet } from './TicketActionSheets';
import { avatarTint, initialsOf } from '../home/celebrationUtils';

interface TicketsViewProps {
  firstName: string;
  currentUser: string;
  tickets: Ticket[];
  onBack: () => void;
  onCreate: () => void;
  onComment: (ticketId: string, text: string) => void;
  onReopen: (ticketId: string, reason: string) => void;
  /** Present for managers: enables the "Team's Tickets" tab */
  teamTickets?: Ticket[];
}

type TicketsTab = 'mine' | 'team';

/* ------------------------------ Illustration ------------------------------ */

/** Minimal themed illustration: a support ticket with a check badge and sparkles */
const TicketIllustration: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-44 h-auto" role="img" aria-label="A resolved support ticket">
    <defs>
      <linearGradient id="tk-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#F5F3FF" />
      </linearGradient>
      <linearGradient id="tk-band" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5B7BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="78" rx="80" ry="60" fill="url(#tk-bg)" />
    <ellipse cx="100" cy="136" rx="52" ry="5" fill="#E0E7FF" />
    <g transform="rotate(-8 100 80)">
      <path
        d="M52 52h96a8 8 0 0 1 8 8v10a10 10 0 0 0 0 20v10a8 8 0 0 1-8 8H52a8 8 0 0 1-8-8V90a10 10 0 0 0 0-20V60a8 8 0 0 1 8-8Z"
        fill="#FFFFFF"
        stroke="#E0E7FF"
        strokeWidth="2"
      />
      <rect x="44" y="52" width="112" height="12" rx="6" fill="url(#tk-band)" opacity="0.9" />
      <line x1="118" y1="68" x2="118" y2="104" stroke="#E0E7FF" strokeWidth="2" strokeDasharray="3 4" />
      <rect x="58" y="74" width="46" height="5" rx="2.5" fill="#C7D2FE" />
      <rect x="58" y="85" width="38" height="4" rx="2" fill="#E2E8F0" />
      <rect x="58" y="94" width="28" height="4" rx="2" fill="#E2E8F0" />
    </g>
    <circle cx="146" cy="42" r="15" fill="#10B981" />
    <path d="m139.5 42.5 4.5 4.5 8.5-9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M38 40l1.8 4.2L44 46l-4.2 1.8L38 52l-1.8-4.2L32 46l4.2-1.8L38 40Z" fill="#A78BFA" opacity="0.75" />
    <path d="M168 94l1.5 3.5L173 99l-3.5 1.5L168 104l-1.5-3.5L163 99l3.5-1.5L168 94Z" fill="#7DD3FC" opacity="0.85" />
    <circle cx="30" cy="100" r="2.5" fill="#C4B5FD" />
    <circle cx="172" cy="62" r="2" fill="#A5B4FC" />
  </svg>
);

/* ------------------------------ Detail sheet ------------------------------ */

const TicketDetailSheet: React.FC<{
  ticket: Ticket | null;
  showRaisedBy: boolean;
  onClose: () => void;
  onOpenComments: (t: Ticket) => void;
}> = ({ ticket, showRaisedBy, onClose, onOpenComments }) => {
  const [cached, setCached] = useState<Ticket | null>(ticket);
  useEffect(() => {
    if (ticket) setCached(ticket);
  }, [ticket]);
  const t = ticket || cached;
  if (!t) return null;

  const rows = [
    { icon: Hash, label: 'Ticket No.', value: `#${t.id}` },
    ...(showRaisedBy ? [{ icon: UserRound, label: 'Raised by', value: `${t.staffName} · ${t.staffCode}` }] : []),
    { icon: Building2, label: 'Department', value: t.department },
    { icon: Flag, label: 'Priority', value: t.priority },
    { icon: CalendarClock, label: 'Raised on', value: formatTicketDateTime(t.createdAt) },
  ];

  return (
    <BottomSheet isOpen={Boolean(ticket)} onClose={onClose} maxHeight="max-h-[88%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLES[t.status].chip}`}>
            {t.status}
          </span>
          <h2 className="mt-1.5 text-[15px] font-bold text-[#1E293B] leading-snug">{t.subject}</h2>
        </div>
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
        <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs">
              <span className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {label}
              </span>
              <span className="font-bold text-[#1E293B] text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <span className="block text-[11px] font-semibold text-slate-500">Description</span>
          {t.descriptionHtml ? (
            <div
              className="ticket-rich p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs leading-relaxed text-slate-700"
              // Sanitised on submit (see sanitizeTicketHtml)
              dangerouslySetInnerHTML={{ __html: t.descriptionHtml }}
            />
          ) : (
            <p className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400">No description added.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onOpenComments(t)}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-50 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          Comments{t.comments.length ? ` (${t.comments.length})` : ''}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Close
        </button>
      </div>
    </BottomSheet>
  );
};

/* ------------------------------- Ticket card ------------------------------ */

const TicketCard: React.FC<{
  ticket: Ticket;
  showRaisedBy: boolean;
  onView: () => void;
  onComment: () => void;
  onReopen: () => void;
}> = ({ ticket: t, showRaisedBy, onView, onComment, onReopen }) => {
  const preview = htmlToText(t.descriptionHtml);
  const canReopen = t.status === 'Closed';
  const avatarIdx = Number(t.staffCode.replace(/\D/g, '')) || 0;

  return (
    <article className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      <button type="button" onClick={onView} className="w-full text-left p-3.5 space-y-2.5 active:bg-slate-50 cursor-pointer">
        {showRaisedBy && (
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${avatarTint(avatarIdx)}`}>
              {initialsOf(t.staffName)}
            </span>
            <span className="text-[11px] font-semibold text-slate-700">{t.staffName}</span>
            <span className="text-[10px] text-slate-400">{t.staffCode}</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-[13px] font-bold text-[#1E293B] leading-snug line-clamp-2">{t.subject}</h4>
            <p className="mt-0.5 text-[11px] text-slate-400">
              #{t.id} · {formatTicketDate(t.createdAt)}
            </p>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 whitespace-nowrap ${STATUS_STYLES[t.status].chip}`}>
            {t.status}
          </span>
        </div>
        {preview && <p className="text-[11.5px] text-slate-500 leading-relaxed line-clamp-2">{preview}</p>}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10.5px] font-semibold max-w-full">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{t.department}</span>
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-semibold ${PRIORITY_STYLES[t.priority].chip}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_STYLES[t.priority].dot}`} />
            {t.priority}
          </span>
        </div>
      </button>

      {/* Actions: View · Comment · Reopen (closed only) */}
      <div className={`grid ${canReopen ? 'grid-cols-3' : 'grid-cols-2'} border-t border-slate-100 divide-x divide-slate-100`}>
        <button
          type="button"
          onClick={onView}
          className="h-10 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 active:bg-slate-50 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        <button
          type="button"
          onClick={onComment}
          className="h-10 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 active:bg-slate-50 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Comment
          {t.comments.length > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-blue-50 text-[#2F68FE] text-[9.5px] font-bold flex items-center justify-center">
              {t.comments.length}
            </span>
          )}
        </button>
        {canReopen && (
          <button
            type="button"
            onClick={onReopen}
            className="h-10 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-amber-600 active:bg-amber-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reopen
          </button>
        )}
      </div>
    </article>
  );
};

/* --------------------------------- Screen --------------------------------- */

export const TicketsView: React.FC<TicketsViewProps> = ({
  firstName,
  currentUser,
  tickets,
  onBack,
  onCreate,
  onComment,
  onReopen,
  teamTickets,
}) => {
  const isManager = Boolean(teamTickets);
  const [tab, setTab] = useState<TicketsTab>(isManager ? 'team' : 'mine');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  // Team's tab only: team member / status / priority / department filters
  const [teamFilters, setTeamFilters] = useState<FilterSelection>({});
  const [isTeamFilterOpen, setIsTeamFilterOpen] = useState(false);
  // Sheets track the ticket by id so they always show the latest data (e.g. new comments)
  const [viewId, setViewId] = useState<string | null>(null);
  const [commentId, setCommentId] = useState<string | null>(null);
  const [reopenId, setReopenId] = useState<string | null>(null);

  const showTeam = isManager && tab === 'team';
  const list = showTeam ? teamTickets ?? [] : tickets;
  const allTickets = [...tickets, ...(teamTickets ?? [])];
  const byId = (id: string | null) => (id ? allTickets.find((t) => t.id === id) ?? null : null);

  const visible = list.filter(
    (t) =>
      (!statusFilter || t.status === statusFilter) &&
      (!showTeam ||
        matchesFilters(teamFilters, {
          member: t.staffName,
          status: t.status,
          priority: t.priority,
          department: t.department,
        }))
  );
  const teamFilterCount = showTeam ? activeFilterCount(teamFilters) : 0;
  const isFiltered = Boolean(statusFilter) || teamFilterCount > 0;
  const teamFilterSections = [
    {
      id: 'member',
      label: 'Team Member',
      options: Array.from(new Set((teamTickets ?? []).map((t) => t.staffName))).sort(),
    },
    { id: 'status', label: 'Status', options: TICKET_STATUSES },
    { id: 'priority', label: 'Priority', options: TICKET_PRIORITIES },
    { id: 'department', label: 'Department', options: TICKET_DEPARTMENTS },
  ];
  const isEmpty = list.length === 0;
  const openTeamCount = (teamTickets ?? []).filter((t) => t.status === 'Open').length;

  const switchTab = (next: TicketsTab) => {
    setTab(next);
    setStatusFilter(null);
    setTeamFilters({});
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Header */}
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
          <h1 className="text-base font-bold ml-2">Tickets</h1>
        </div>
        {isManager && (
          <div className="grid grid-cols-2 border-t border-[#F1F5F9]" role="tablist">
            {(
              [
                { id: 'mine', label: 'My Tickets' },
                { id: 'team', label: "Team's Tickets" },
              ] as const
            ).map(({ id, label }) => {
              const isActive = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => switchTab(id)}
                  className={`relative py-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    isActive ? 'text-[#2F68FE] font-bold' : 'text-slate-400 font-medium'
                  }`}
                >
                  {label}
                  {id === 'team' && openTeamCount > 0 && (
                    <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center">
                      {openTeamCount}
                    </span>
                  )}
                  {isActive && <span className="absolute bottom-0 left-4 right-4 h-0.75 rounded-t-full bg-[#2F68FE]" />}
                </button>
              );
            })}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        <TicketKPICard tickets={list} onOpenSummary={() => setIsSummaryOpen(true)} />

        {isEmpty ? (
          showTeam ? (
            <div className="py-10 flex flex-col items-center text-center">
              <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-[#1E293B]">No tickets from your team</p>
              <p className="text-xs text-slate-500">You'll see them here as soon as someone raises one.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center pt-2 pb-6 px-2">
              <TicketIllustration />
              <h2 className="mt-4 text-lg font-extrabold tracking-tight text-[#1E1B4B]">All smooth sailing, {firstName}! ✨</h2>
              <p className="mt-2 text-[13px] text-slate-500 leading-relaxed max-w-[290px]">
                You haven't raised any tickets yet. If something isn't working — IT, HR or admin — we're just a tap away.
              </p>
            </div>
          )
        ) : (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 px-1 min-h-9">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {isFiltered ? 'Filtered' : 'All tickets'} ({visible.length})
              </h3>
              <div className="flex items-center gap-2">
              {statusFilter && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(null)}
                  className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-[10.5px] font-bold cursor-pointer ${STATUS_STYLES[statusFilter].chip}`}
                  aria-label={`Clear ${statusFilter} filter`}
                >
                  {statusFilter}
                  <X className="w-3 h-3" />
                </button>
              )}
              {showTeam && <FilterIconButton count={teamFilterCount} onClick={() => setIsTeamFilterOpen(true)} />}
              </div>
            </div>
            {visible.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                showRaisedBy={showTeam}
                onView={() => setViewId(t.id)}
                onComment={() => setCommentId(t.id)}
                onReopen={() => setReopenId(t.id)}
              />
            ))}
            {visible.length === 0 && (
              <div className="py-10 flex flex-col items-center text-center">
                <span className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </span>
                <p className="mt-3 text-sm font-bold text-[#1E293B]">No tickets match your filters</p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter(null);
                    setTeamFilters({});
                  }}
                  className="mt-1 text-xs font-semibold text-[#2F68FE] cursor-pointer"
                >
                  Show all tickets
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Sticky CTA (own tickets only) */}
      {!showTeam && (
        <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={onCreate}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            Create New Ticket
          </button>
        </div>
      )}

      <TeamFilterSheet
        isOpen={isTeamFilterOpen}
        title="Filter Team's Tickets"
        sections={teamFilterSections}
        selection={teamFilters}
        onClose={() => setIsTeamFilterOpen(false)}
        onApply={(next) => {
          setTeamFilters(next);
          setIsTeamFilterOpen(false);
        }}
      />
      <TicketSummarySheet
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        tickets={list}
        scopeLabel={showTeam ? "Team's Tickets" : 'My Tickets'}
        activeStatus={statusFilter}
        onSelectStatus={(s) => {
          setStatusFilter((prev) => (prev === s ? null : s));
          setIsSummaryOpen(false);
        }}
      />
      <TicketDetailSheet
        ticket={byId(viewId)}
        showRaisedBy={showTeam}
        onClose={() => setViewId(null)}
        onOpenComments={(t) => {
          setViewId(null);
          setCommentId(t.id);
        }}
      />
      <TicketCommentsSheet
        ticket={byId(commentId)}
        currentUser={currentUser}
        onClose={() => setCommentId(null)}
        onSend={onComment}
      />
      <ReopenTicketSheet
        ticket={byId(reopenId)}
        onClose={() => setReopenId(null)}
        onReopen={(id, reason) => {
          setReopenId(null);
          onReopen(id, reason);
        }}
      />
    </div>
  );
};
