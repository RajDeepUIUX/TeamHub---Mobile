import React, { useState } from 'react';
import { ArrowLeft, Timer, Plus, Globe, CalendarRange, Lock, Ticket, BadgeCheck } from 'lucide-react';
import { OTRequest } from '../../types/overtime';
import { otAvailabilityPeriod, otAvailabilityShort, otFte, otPendingHours } from '../../data/overtimeData';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { TeamOTRequestView } from './TeamOTRequestView';

interface OTRequestViewProps {
  firstName: string;
  requests: OTRequest[];
  /** OT hours currently available (from the leave balance) */
  otHours: number;
  onBack: () => void;
  onAddRequest: () => void;
  /** A submitted request can't be edited; changes go through a ticket */
  onRaiseTicket: () => void;
  /** Present for managers: enables the view-only "Team's Requests" tab */
  team?: {
    requests: OTRequest[];
  };
}

/** Minimal themed illustration: a moon over a desk lamp and laptop — late hours, gently */
const LateHoursIllustration: React.FC = () => (
  <svg viewBox="0 0 200 160" className="w-52 h-auto" role="img" aria-label="A desk lamp and laptop under a crescent moon">
    <defs>
      <linearGradient id="ot-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#FFF7ED" />
      </linearGradient>
      <linearGradient id="ot-moon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="ot-screen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5B7BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="84" rx="82" ry="64" fill="url(#ot-bg)" />
    <ellipse cx="100" cy="144" rx="62" ry="5" fill="#E0E7FF" />

    {/* Crescent moon + stars */}
    <path d="M150 30a16 16 0 1 0 12 26 13 13 0 1 1-12-26Z" fill="url(#ot-moon)" />
    <path d="M44 38l1.6 3.8L49.5 43l-3.9 1.4L44 48l-1.6-3.6L38.5 43l3.9-1.2L44 38Z" fill="#A78BFA" opacity="0.8" />
    <circle cx="126" cy="26" r="2" fill="#C4B5FD" />
    <circle cx="170" cy="70" r="1.8" fill="#A5B4FC" />

    {/* Desk */}
    <rect x="40" y="128" width="120" height="6" rx="3" fill="#C7D2FE" />

    {/* Laptop */}
    <rect x="86" y="92" width="54" height="34" rx="4" fill="url(#ot-screen)" />
    <rect x="91" y="97" width="44" height="3" rx="1.5" fill="#FFFFFF" opacity="0.7" />
    <rect x="91" y="103" width="32" height="3" rx="1.5" fill="#FFFFFF" opacity="0.5" />
    <rect x="91" y="109" width="38" height="3" rx="1.5" fill="#FFFFFF" opacity="0.5" />
    <path d="M80 126h66l-4 3H84l-4-3Z" fill="#94A3B8" />

    {/* Desk lamp with warm glow */}
    <path d="M58 90l18 36" fill="none" stroke="#FDE68A" strokeWidth="18" strokeLinecap="round" opacity="0.35" />
    <path d="M52 128h16" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 128V104l10-14" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M62 84l16-6 4 10-16 6-4-10Z" fill="#6366F1" />

    {/* Mug */}
    <rect x="148" y="112" width="11" height="14" rx="2.5" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="1.5" />
    <path d="M151 108c0-3 3-3 3-6" fill="none" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const OTRequestCard: React.FC<{
  request: OTRequest;
  /** Manager view: show who raised it (read-only) */
  showStaff?: boolean;
}> = ({ request: r, showStaff }) => {
  const stats = [
    { label: 'Extra hrs', value: r.extraHours ?? '—' },
    { label: 'FTE', value: r.extraHours ? otFte(r.extraHours) : '—' },
    { label: 'Assigned', value: r.assignedHours },
    { label: 'Pending', value: otPendingHours(r) },
  ];
  return (
    <article className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 shadow-2xs space-y-3">
      {showStaff && (
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarTint(
              Number(r.staffCode.replace(/\D/g, '')) || 0
            )}`}
          >
            {initialsOf(r.staffName)}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-[#1E293B] truncate">{r.staffName}</span>
            <span className="block text-[10.5px] text-slate-400">{r.staffCode}</span>
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[14px] font-extrabold text-[#1E293B] leading-tight">{r.domain}</h4>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
            <Globe className="w-3 h-3 text-slate-400" />
            {r.country}
            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">{r.clientType} client</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 bg-[#E8F8F0] text-[#10B981]">
          <BadgeCheck className="w-3 h-3" />
          {r.status}
        </span>
      </div>

      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
        <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />
        <span>
          <span className="font-bold text-[#1E293B]">{otAvailabilityShort(r.availability)}</span>
          <span className="text-slate-500"> · {otAvailabilityPeriod(r.availability)}</span>
        </span>
      </div>

      <div className="grid grid-cols-4 rounded-xl border border-slate-100 divide-x divide-slate-100 text-center">
        {stats.map(({ label, value }) => (
          <div key={label} className="py-2">
            <span className="block text-sm font-extrabold text-[#1E293B] tabular-nums">{value}</span>
            <span className="block text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
          </div>
        ))}
      </div>

      {r.remarks && <p className="text-[11.5px] text-slate-500 leading-relaxed">“{r.remarks}”</p>}

      <p className="flex items-center justify-between gap-2 text-[10.5px] text-slate-400">
        <span>
          Submitted {new Date(r.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · auto-approved'}
        </span>
        {!showStaff && (
          <span className="flex items-center gap-1 shrink-0">
            <Lock className="w-3 h-3" />
            Edit via ticket
          </span>
        )}
      </p>

    </article>
  );
};

export const OTRequestView: React.FC<OTRequestViewProps> = ({ firstName, requests, otHours, onBack, onAddRequest, onRaiseTicket, team }) => {
  const [tab, setTab] = useState<'mine' | 'team'>(team ? 'team' : 'mine');
  const showTeam = Boolean(team) && tab === 'team';
  // Only one OT request per person
  const hasRequest = requests.length > 0;

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
        <h1 className="text-base font-bold ml-2">OT Request</h1>
      </div>
      {team && (
        <div className="px-4 pb-3">
          <SegmentedTabs
            ariaLabel="OT request view"
            value={tab}
            onChange={setTab}
            options={[
              { id: 'mine', label: 'My OT Request' },
              { id: 'team', label: "Team's Requests" },
            ]}
          />
        </div>
      )}
    </header>

    {showTeam && team ? (
      <TeamOTRequestView requests={team.requests} />
    ) : requests.length === 0 ? (
      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
        <div className="min-h-full flex flex-col items-center justify-center text-center py-10">
          <LateHoursIllustration />
          <h2 className="mt-6 text-xl font-extrabold tracking-tight text-[#1E1B4B]">Burning the midnight oil, {firstName}? 🌙</h2>
          <p className="mt-2 text-[13px] text-slate-500 leading-relaxed max-w-[295px]">
            Your extra effort deserves to be counted. Tell us how many extra hours you can take on, and it's approved
            straight away.
          </p>
          <p className="mt-3 text-[12px] text-slate-400 leading-relaxed max-w-[280px]">
            Nothing logged yet — and that's okay. We hope your days end right on time.
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[11px] font-semibold text-slate-500 shadow-2xs">
            <Timer className="w-3.5 h-3.5 text-amber-500" />
            OT balance: {otHours} {otHours === 1 ? 'hr' : 'hrs'} available
          </span>
        </div>
      </div>
    ) : (
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {/* Totals (mirrors the web table's Total row) */}
        <section className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              {
                label: 'Extra Available',
                value: requests.reduce((n, r) => n + (r.extraHours ?? 0), 0),
                pill: 'bg-[#EFF6FF] text-[#2F68FE]',
              },
              { label: 'Assigned', value: requests.reduce((n, r) => n + r.assignedHours, 0), pill: 'bg-[#E8F8F0] text-[#10B981]' },
              { label: 'Pending', value: requests.reduce((n, r) => n + otPendingHours(r), 0), pill: 'bg-[#FEF8E7] text-[#D97706]' },
            ].map(({ label, value, pill }) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`w-14 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${pill}`}>
                  {value}
                </div>
                <span className="text-[11px] text-gray-500 font-medium">{label} hrs</span>
              </div>
            ))}
          </div>
        </section>

        <h3 className="px-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Your OT request</h3>
        {requests.map((r) => (
          <OTRequestCard key={r.id} request={r} />
        ))}
      </div>
    )}

    {!showTeam && (
    <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {hasRequest ? (
        // One request only; changes go through a ticket
        <div className="space-y-2.5">
          <p className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />
            <span>
              You've already submitted your OT request, and it can't be edited here. To change it, raise a ticket.
            </span>
          </p>
          <button
            type="button"
            onClick={onRaiseTicket}
            className="w-full h-12 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-2 active:bg-blue-50 transition-colors cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            Raise a Ticket
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onAddRequest}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add OT Request
        </button>
      )}
    </div>
    )}
  </div>
  );
};
