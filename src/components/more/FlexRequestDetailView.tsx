import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  CalendarCheck,
  FileText,
  Paperclip,
  Package,
  MapPin,
  ShieldCheck,
  StickyNote,
  MessageSquare,
  ChevronRight,
  Check,
  X,
  Pencil,
  Building2,
  Home,
  Send,
  RefreshCw,
  CircleDot,
} from 'lucide-react';
import { FlexRequest } from '../../types/workTiming';
import { WEEKDAYS, flexMeta, formatFlexDate, formatSpan } from '../../data/workTimingData';
import { FLEX_ICONS } from './RequestFlexibilityView';
import { FLEX_STATUS_CHIP } from './FlexRequestCard';
import { FlexReviewSheet, FlexDecision } from './FlexReviewSheet';
import { CommentThreadSheet } from '../common/CommentThreadSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';

interface FlexRequestDetailViewProps {
  request: FlexRequest;
  /** 'manager' shows who raised it + Approve / Reject; 'staff' shows Edit while pending */
  viewer: 'manager' | 'staff';
  currentUser: string;
  onBack: () => void;
  onComment: (id: string, text: string) => void;
  onReview?: (ids: string[], decision: FlexDecision, comment: string) => void;
  onEdit?: (request: FlexRequest) => void;
}

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

const daysInclusive = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000) + 1;

/* ------------------------------- Building blocks ------------------------------- */

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; right?: React.ReactNode }> = ({
  icon,
  title,
  children,
  right,
}) => (
  <section className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 shadow-2xs space-y-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">{icon}</span>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#1E293B]">{title}</h3>
      </div>
      {right}
    </div>
    {children}
  </section>
);

const Row: React.FC<{ label: string; value: React.ReactNode; last?: boolean }> = ({ label, value, last }) => (
  <div className={`flex items-start justify-between gap-3 py-2 text-xs ${last ? '' : 'border-b border-slate-100'}`}>
    <span className="text-slate-500 font-medium shrink-0">{label}</span>
    <span className="font-bold text-[#1E293B] text-right min-w-0 break-words">{value}</span>
  </div>
);

const TimeWindow: React.FC<{ tone: 'wfo' | 'wfh' | 'plain'; label: string; from: string; to: string }> = ({ tone, label, from, to }) => {
  const styles =
    tone === 'wfo'
      ? 'bg-[#F5F7FF] border-[#DDE3FB] text-[#2F68FE]'
      : tone === 'wfh'
        ? 'bg-[#FFFAF0] border-[#FBE5C0] text-[#C2710C]'
        : 'bg-slate-50 border-slate-100 text-slate-600';
  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border ${styles}`}>
      <span className="flex items-center gap-1.5 text-[11px] font-bold">
        {tone === 'wfo' ? <Building2 className="w-3.5 h-3.5" /> : tone === 'wfh' ? <Home className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
        {label}
      </span>
      <span className="text-right">
        <span className="block text-xs font-extrabold text-[#1E293B] tabular-nums">
          {from} – {to}
        </span>
        <span className="block text-[10px] font-medium text-slate-400">{formatSpan(from, to)}</span>
      </span>
    </div>
  );
};

/* ------------------------------------ Screen ------------------------------------ */

export const FlexRequestDetailView: React.FC<FlexRequestDetailViewProps> = ({
  request: r,
  viewer,
  currentUser,
  onBack,
  onComment,
  onReview,
  onEdit,
}) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [decision, setDecision] = useState<FlexDecision | null>(null);

  const Icon = FLEX_ICONS[r.type];
  const meta = flexMeta(r.type);
  const isPending = r.status === 'Pending';
  const isManager = viewer === 'manager';
  const avatarIdx = Number((r.staffCode ?? '').replace(/\D/g, '')) || 0;
  const people = (r.comments ?? []).filter((c) => c.role !== 'System');
  const latest = people.slice(-2);
  const assets = r.wfh ? Object.entries(r.wfh.assets) : [];
  const address = r.wfh?.deliveryAddress;

  // Status timeline: submitted → (updated) → manager decision
  const timeline: { icon: React.ReactNode; title: string; subtitle: string; tone: string }[] = [
    { icon: <Send className="w-3 h-3" />, title: 'Submitted', subtitle: dateTime(r.submittedAt), tone: 'bg-[#2F68FE] text-white' },
    ...(r.updatedAt
      ? [{ icon: <RefreshCw className="w-3 h-3" />, title: 'Updated by staff', subtitle: dateTime(r.updatedAt), tone: 'bg-sky-500 text-white' }]
      : []),
    isPending
      ? {
          icon: <CircleDot className="w-3 h-3" />,
          title: 'Awaiting manager approval',
          subtitle: isManager ? 'Your decision is needed' : 'Your manager will review it soon',
          tone: 'bg-white border-2 border-amber-300 text-amber-500',
        }
      : {
          icon: r.status === 'Approved' ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />,
          title: `${r.status} by ${isManager ? 'you' : r.reviewedBy ?? 'your manager'}`,
          subtitle: r.reviewedAt ?? '',
          tone: r.status === 'Approved' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white',
        },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold ml-2 truncate">Request Details</h1>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${FLEX_STATUS_CHIP[r.status]}`}>{r.status}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3.5">
        {/* Summary */}
        <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
          {isManager && (
            <div className="flex items-center gap-3 px-3.5 py-3 border-b border-slate-100">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(avatarIdx)}`}>
                {initialsOf(r.staffName)}
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-bold text-[#1E293B] truncate">{r.staffName}</span>
                <span className="block text-[11px] text-slate-400">Requested by your team member</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3.5">
            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${meta.tint}`}>
              <Icon className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-extrabold text-[#1E293B] leading-tight">{r.type}</h2>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                {r.duration && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">{r.duration}</span>
                )}
                <span className="text-[11px] text-slate-500">{meta.description}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <ol className="px-3.5 pb-3.5">
            {timeline.map((step, idx) => (
              <li key={step.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.tone}`}>{step.icon}</span>
                  {idx < timeline.length - 1 && <span className="w-px flex-1 bg-slate-200 my-1" />}
                </div>
                <div className={`min-w-0 ${idx < timeline.length - 1 ? 'pb-2.5' : ''}`}>
                  <span className="block text-xs font-semibold text-[#1E293B]">{step.title}</span>
                  {step.subtitle && <span className="block text-[10.5px] text-slate-400">{step.subtitle}</span>}
                </div>
              </li>
            ))}
          </ol>

          {!isPending && r.managerComment && (
            <p
              className={`mx-3.5 mb-3.5 px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                r.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <span className="font-semibold">{r.status === 'Rejected' ? 'Reason' : 'Note'}: </span>“{r.managerComment}”
            </p>
          )}
        </section>

        {/* When */}
        {r.type !== 'Work From Office' && r.startDate && (
          <Section icon={<CalendarDays className="w-4 h-4" />} title="Date Information">
            {r.duration === 'Temporary' && r.endDate ? (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</span>
                  <span className="block text-xs font-bold text-[#1E293B]">{formatFlexDate(r.startDate)}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">To</span>
                  <span className="block text-xs font-bold text-[#1E293B]">{formatFlexDate(r.endDate)}</span>
                </div>
              </div>
            ) : (
              <Row label="Effective from" value={formatFlexDate(r.startDate)} last />
            )}
            {r.duration === 'Temporary' && r.endDate && (
              <p className="text-[11px] text-slate-500">
                {daysInclusive(r.startDate, r.endDate)} calendar days, then back to the regular schedule.
              </p>
            )}
          </Section>
        )}
        {r.duration === 'Permanent' && !r.startDate && r.type !== 'Work From Office' && (
          <Section icon={<CalendarDays className="w-4 h-4" />} title="Date Information">
            <p className="text-xs text-slate-600">Permanent arrangement — ongoing, with no end date.</p>
          </Section>
        )}

        {/* Timings */}
        {(r.type === 'Work From Office' || r.type === 'Early Shift' || r.type === 'Early Friday') && r.startTime && r.endTime && (
          <Section
            icon={r.type === 'Early Friday' ? <CalendarDays className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            title={r.type === 'Work From Office' ? 'Office Hours' : r.type === 'Early Friday' ? 'Friday Timings' : 'Shift Timings'}
          >
            {(r.type === 'Early Shift' || r.type === 'Early Friday') && (
              <p className="px-3 py-2 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[11px] text-[#3730A3]">
                Standalone arrangement — the current work mode stays unchanged.
              </p>
            )}
            <TimeWindow
              tone={r.type === 'Work From Office' ? 'wfo' : 'plain'}
              label={r.type === 'Work From Office' ? 'In office' : r.type === 'Early Friday' ? 'Fridays' : 'Shift'}
              from={r.startTime}
              to={r.endTime}
            />
          </Section>
        )}

        {r.hybrid && (
          <Section icon={<CalendarCheck className="w-4 h-4" />} title="Hybrid Information">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-500">
                {r.hybrid.mode === 'Daily' ? 'Applies every working day' : 'Applies on selected days'}
              </span>
              {r.hybrid.mode === 'Days' && (
                <div className="grid grid-cols-5 gap-1.5">
                  {WEEKDAYS.map((d) => {
                    const on = r.hybrid!.days?.includes(d);
                    return (
                      <span
                        key={d}
                        className={`h-9 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                          on ? 'bg-[#2F68FE] text-white' : 'bg-slate-50 text-slate-300 border border-slate-100'
                        }`}
                      >
                        {d}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <TimeWindow tone="wfo" label="WFO" from={r.hybrid.wfoFrom} to={r.hybrid.wfoTo} />
            <TimeWindow tone="wfh" label="WFH" from={r.hybrid.wfhFrom} to={r.hybrid.wfhTo} />
          </Section>
        )}

        {/* Request details */}
        {r.wfh && (
          <Section icon={<FileText className="w-4 h-4" />} title="Request Details">
            <Row label="Reason" value={r.wfh.reason} last={r.wfh.attachments.length === 0} />
            {r.wfh.attachments.length > 0 && (
              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold text-slate-500">Attachments</span>
                {r.wfh.attachments.map((name) => (
                  <div key={name} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-100 bg-slate-50/60">
                    <span className="w-8 h-8 rounded-lg bg-white text-[#2F68FE] flex items-center justify-center shadow-2xs shrink-0">
                      <Paperclip className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {assets.length > 0 && (
          <Section
            icon={<Package className="w-4 h-4" />}
            title="Assets Required"
            right={
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2F68FE] text-[10px] font-bold">
                {assets.reduce((n, [, q]) => n + q, 0)} items
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-2">
              {assets.map(([name, qty]) => (
                <div key={name} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-700">{name}</span>
                  <span className="text-xs font-extrabold text-[#2F68FE] tabular-nums">× {qty}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {address && (
          <Section
            icon={<MapPin className="w-4 h-4" />}
            title="Delivery Address"
            right={<span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">{address.type}</span>}
          >
            <div className="text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-[#1E293B]">{address.address}</p>
              <p className="text-slate-500">{address.landmark}</p>
              <p>
                {address.city}, {address.state} {address.zip}
              </p>
              <p className="text-slate-500">{address.country}</p>
            </div>
          </Section>
        )}

        {r.wfh?.acknowledgedBy && (
          <Section icon={<ShieldCheck className="w-4 h-4" />} title="Acknowledgement">
            <div className="flex items-end justify-between px-1 pb-2 border-b border-dashed border-slate-200">
              <span className="text-2xl text-[#1E1B4B] leading-none" style={{ fontFamily: "'Caveat', cursive" }}>
                {r.wfh.acknowledgedBy}
              </span>
              {r.wfh.acknowledgedOn && <span className="text-[11px] text-slate-400">{formatFlexDate(r.wfh.acknowledgedOn)}</span>}
            </div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Terms and Conditions accepted
            </p>
          </Section>
        )}

        {r.reason && (
          <Section icon={<StickyNote className="w-4 h-4" />} title="Notes">
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{r.reason}</p>
          </Section>
        )}

        {/* Conversation preview */}
        <Section
          icon={<MessageSquare className="w-4 h-4" />}
          title="Conversation"
          right={
            <button type="button" onClick={() => setIsCommentsOpen(true)} className="text-[11px] font-semibold text-[#2F68FE] cursor-pointer">
              {people.length ? `View all (${people.length})` : 'Start'}
            </button>
          }
        >
          {latest.length === 0 ? (
            <button
              type="button"
              onClick={() => setIsCommentsOpen(true)}
              className="w-full px-3 py-3 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 text-left active:bg-slate-50 cursor-pointer"
            >
              No comments yet — {isManager ? `ask ${r.staffName.split(' ')[0]} a question` : 'message your manager'} about this request.
            </button>
          ) : (
            <div className="space-y-2">
              {latest.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold flex items-center justify-center shrink-0">
                    {initialsOf(c.author)}
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[10.5px] font-semibold text-slate-500">
                      {c.author === currentUser ? 'You' : c.author}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Sticky actions */}
      <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {isManager && isPending && onReview ? (
          <div className="grid grid-cols-[auto_1fr_1.4fr] gap-2.5">
            <button
              type="button"
              onClick={() => setIsCommentsOpen(true)}
              className="w-12 h-12 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center active:bg-slate-50 cursor-pointer"
              aria-label="Comments"
            >
              <MessageSquare className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              onClick={() => setDecision('Rejected')}
              className="h-12 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold flex items-center justify-center gap-1 active:bg-rose-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button
              type="button"
              onClick={() => setDecision('Approved')}
              className="h-12 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-emerald-700 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
          </div>
        ) : !isManager && isPending && onEdit ? (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsCommentsOpen(true)}
              className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-50 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Comments
            </button>
            <button
              type="button"
              onClick={() => onEdit(r)}
              className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              Edit Request
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCommentsOpen(true)}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            Comments{people.length ? ` (${people.length})` : ''}
          </button>
        )}
      </div>

      <CommentThreadSheet
        isOpen={isCommentsOpen}
        subtitle={`${isManager ? `${r.staffName} · ` : ''}${r.type}${r.duration ? ` · ${r.duration}` : ''}`}
        comments={r.comments ?? []}
        currentUser={currentUser}
        onClose={() => setIsCommentsOpen(false)}
        onSend={(text) => onComment(r.id, text)}
      />
      {onReview && (
        <FlexReviewSheet
          requests={decision ? [r] : []}
          decision={decision}
          onClose={() => setDecision(null)}
          onConfirm={(ids, d, comment) => {
            setDecision(null);
            onReview(ids, d, comment);
          }}
        />
      )}
    </div>
  );
};
