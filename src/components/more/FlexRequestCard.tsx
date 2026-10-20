import React from 'react';
import { CalendarDays, Check, ChevronRight, Clock, MessageSquare } from 'lucide-react';
import { FlexRequest } from '../../types/workTiming';
import { flexDetailLabel, flexMeta, flexPeriodLabel } from '../../data/workTimingData';
import { FLEX_ICONS } from './RequestFlexibilityView';
import { avatarTint, initialsOf } from '../home/celebrationUtils';

export const FLEX_STATUS_CHIP: Record<FlexRequest['status'], string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  Approved: 'bg-[#E8F8F0] text-[#10B981]',
  Rejected: 'bg-[#FEF2F2] text-[#EF4444]',
  'IT Review Done': 'bg-[#EEF2FF] text-[#4F46E5]',
};

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

interface FlexRequestCardProps {
  request: FlexRequest;
  /** Manager view: show who raised it */
  showStaff?: boolean;
  /** Bulk-selection state (manager view) */
  selectable?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  onToggleSelect?: () => void;
  /** Footer actions (Edit for staff; Approve / Reject for managers) */
  actions?: React.ReactNode;
  /** Wording for the manager's comment (staff sees "Manager's note", manager sees "Your note") */
  commentPerspective?: 'staff' | 'manager';
  /** Opens the comment thread for this request */
  onOpenComments?: () => void;
  /** Opens the full details screen */
  onOpen?: () => void;
}

export const FlexRequestCard: React.FC<FlexRequestCardProps> = ({
  request: r,
  showStaff = false,
  selectable = false,
  selected = false,
  dimmed = false,
  onToggleSelect,
  actions,
  commentPerspective = 'staff',
  onOpenComments,
  onOpen,
}) => {
  // Only people's messages count towards the badge, not system notes
  const commentCount = (r.comments ?? []).filter((c) => c.role !== 'System').length;
  const Icon = FLEX_ICONS[r.type];
  const meta = flexMeta(r.type);
  const detail = flexDetailLabel(r);
  const avatarIdx = Number((r.staffCode ?? '').replace(/\D/g, '')) || 0;
  const opens = Boolean(onOpen) && !selectable;
  const PeriodIcon = r.type === 'Work From Office' ? Clock : CalendarDays;

  const statusChip = (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${FLEX_STATUS_CHIP[r.status]}`}>{r.status}</span>
  );

  return (
    <article
      onClick={selectable ? onToggleSelect : onOpen}
      aria-selected={selectable ? selected : undefined}
      className={`bg-white border rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden transition-all ${
        selected ? 'border-[#2F68FE] ring-2 ring-[#2F68FE]/20' : r.status === 'Pending' ? 'border-amber-200' : 'border-[#EBF0F7]'
      } ${dimmed ? 'opacity-45' : ''} ${selectable || onOpen ? 'cursor-pointer' : ''} ${
        opens ? 'active:scale-[0.99] active:shadow-none' : ''
      }`}
    >
      <div className="p-3.5 space-y-3">
        {showStaff ? (
          <>
            {/* Who + status */}
            <div className="flex items-center gap-3">
              {selectable && (
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
                  }`}
                  aria-hidden="true"
                >
                  {selected && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              )}
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(avatarIdx)}`}>
                {initialsOf(r.staffName)}
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[#1E293B] leading-tight truncate">{r.staffName}</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">Submitted {shortDate(r.submittedAt)}</span>
              </div>
              {statusChip}
            </div>

            {/* What was asked for: the tappable part of the card */}
            <div
              className={`rounded-2xl bg-slate-50/80 border border-slate-100 p-3 flex items-center gap-3 ${
                opens ? 'active:bg-slate-100' : ''
              }`}
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${meta.tint}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {r.type}
                  </span>
                  {r.duration && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 text-[10px] font-semibold">
                      {r.duration}
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#1E293B]">
                  <PeriodIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{flexPeriodLabel(r)}</span>
                </p>
                {detail && <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{detail}</p>}
              </div>
              {opens && (
                <span className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            {/* What + when + status (staff: no avatar, so the type icon leads) */}
            <div className="flex items-start gap-3">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.tint}`}>
                <Icon className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-[13px] font-bold text-[#1E293B]">{r.type}</h4>
                  {r.duration && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">{r.duration}</span>
                  )}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                  <PeriodIcon className="w-3 h-3 text-slate-400 shrink-0" />
                  {flexPeriodLabel(r)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {statusChip}
                {opens && <ChevronRight className="w-4 h-4 text-slate-300" />}
              </div>
            </div>
            {detail && (
              <p className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-600">{detail}</p>
            )}
          </>
        )}

        {/* Manager decision */}
        {r.status !== 'Pending' && (
          <p
            className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
              r.status === 'Rejected' ? 'bg-rose-50/70 text-rose-700' : 'bg-emerald-50/70 text-emerald-700'
            }`}
          >
            <span className="font-semibold">
              {r.status === 'IT Review Done' ? 'Approved' : r.status} by{' '}
              {commentPerspective === 'manager' ? 'you' : r.reviewedBy ?? 'your manager'}
              {r.reviewedAt ? ` on ${r.reviewedAt}` : ''}
            </span>
            {r.status === 'IT Review Done' && (
              <>
                <br />
                <span className="font-semibold text-[#4F46E5]">
                  IT review done{r.itReviewedAt ? ` on ${r.itReviewedAt}` : ''}
                </span>
              </>
            )}
            {r.managerComment && (
              <>
                <br />
                {r.status === 'Rejected' ? 'Reason' : 'Note'}: “{r.managerComment}”
              </>
            )}
          </p>
        )}

        {!showStaff && r.status === 'Pending' && (
          <p className="text-[10.5px] text-slate-400">
            {r.updatedAt ? `Updated ${shortDate(r.updatedAt)}` : `Submitted ${shortDate(r.submittedAt)}`} · awaiting approval — you can
            still edit it
          </p>
        )}
      </div>

      {(actions || onOpenComments || opens) && (
        <div
          className="px-3.5 py-2.5 border-t border-slate-100 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {onOpenComments && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments();
              }}
              aria-label={`Comments${commentCount ? ` (${commentCount})` : ''}`}
              className="h-9 px-2.5 rounded-xl text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 active:bg-slate-100 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              {/* With Approve / Reject alongside, the icon + count is enough */}
              {!actions && 'Comments'}
              {commentCount > 0 && (
                <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-blue-50 text-[#2F68FE] text-[10px] font-bold flex items-center justify-center">
                  {commentCount}
                </span>
              )}
            </button>
          )}
          {actions ??
            (opens && (
              <button
                type="button"
                onClick={onOpen}
                className="ml-auto h-9 pl-3 pr-2 rounded-xl text-[11px] font-bold text-[#2F68FE] flex items-center gap-0.5 active:bg-blue-50 cursor-pointer"
              >
                View details
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
        </div>
      )}
    </article>
  );
};
