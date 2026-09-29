import React from 'react';
import { CalendarDays, Check, Paperclip, Package, MapPin, Clock, MessageSquare } from 'lucide-react';
import { FlexRequest } from '../../types/workTiming';
import { flexDetailLabel, flexMeta, flexPeriodLabel } from '../../data/workTimingData';
import { FLEX_ICONS } from './RequestFlexibilityView';
import { avatarTint, initialsOf } from '../home/celebrationUtils';

export const FLEX_STATUS_CHIP: Record<FlexRequest['status'], string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  Approved: 'bg-[#E8F8F0] text-[#10B981]',
  Rejected: 'bg-[#FEF2F2] text-[#EF4444]',
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
  const detail = flexDetailLabel(r);
  const assets = r.wfh ? Object.entries(r.wfh.assets) : [];
  const assetCount = assets.reduce((n, [, q]) => n + q, 0);
  const avatarIdx = Number((r.staffCode ?? '').replace(/\D/g, '')) || 0;

  return (
    <article
      onClick={selectable ? onToggleSelect : onOpen}
      aria-selected={selectable ? selected : undefined}
      className={`bg-white border rounded-2xl shadow-2xs overflow-hidden transition-all ${
        selected ? 'border-[#2F68FE] ring-2 ring-[#2F68FE]/20' : r.status === 'Pending' ? 'border-amber-200' : 'border-[#EBF0F7]'
      } ${dimmed ? 'opacity-45' : ''} ${selectable || onOpen ? 'cursor-pointer' : ''} ${
        onOpen && !selectable ? 'active:bg-slate-50/70' : ''
      }`}
    >
      <div className="p-3.5 space-y-2.5">
        {/* Who (manager view) */}
        {showStaff && (
          <div className="flex items-center gap-2.5">
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
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarTint(avatarIdx)}`}>
              {initialsOf(r.staffName)}
            </span>
            <div className="flex-1 min-w-0">
              <span className="block text-[14px] font-extrabold text-[#1E293B] leading-tight truncate">{r.staffName}</span>
              <span className="block text-[10.5px] text-slate-400 mt-0.5">Submitted {shortDate(r.submittedAt)}</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${FLEX_STATUS_CHIP[r.status]}`}>{r.status}</span>
          </div>
        )}

        {/* What + when */}
        <div className="flex items-start gap-3">
          <span
            className={`${showStaff ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} flex items-center justify-center shrink-0 ${flexMeta(r.type).tint}`}
          >
            <Icon className={showStaff ? 'w-4 h-4' : 'w-5 h-5'} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className={showStaff ? 'text-xs font-semibold text-slate-700' : 'text-[13px] font-bold text-[#1E293B]'}>{r.type}</h4>
              {r.duration && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">{r.duration}</span>
              )}
            </div>
            <p className={`mt-0.5 flex items-center gap-1 ${showStaff ? 'text-[10.5px] text-slate-400' : 'text-[11px] text-slate-500'}`}>
              {r.type === 'Work From Office' ? (
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              ) : (
                <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
              )}
              {flexPeriodLabel(r)}
            </p>
          </div>
          {!showStaff && (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${FLEX_STATUS_CHIP[r.status]}`}>{r.status}</span>
          )}
        </div>

        {detail && (
          <p className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-600">{detail}</p>
        )}

        {/* Attachments, assets, delivery */}
        {(r.wfh?.attachments.length || assetCount > 0) && (
          <div className="flex items-center gap-3 flex-wrap text-[10.5px] text-slate-500">
            {r.wfh && r.wfh.attachments.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {r.wfh.attachments.length} {r.wfh.attachments.length === 1 ? 'file' : 'files'}
              </span>
            )}
            {assetCount > 0 && (
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {assets.map(([name, q]) => `${q}× ${name}`).join(', ')}
              </span>
            )}
            {r.wfh?.deliveryAddress && (
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {r.wfh.deliveryAddress.city}, {r.wfh.deliveryAddress.zip}
                </span>
              </span>
            )}
          </div>
        )}

        {r.reason && <p className="text-[11.5px] text-slate-500 leading-relaxed line-clamp-3">“{r.reason}”</p>}

        {/* Manager decision */}
        {r.status !== 'Pending' && (
          <p
            className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
              r.status === 'Rejected' ? 'bg-rose-50/70 text-rose-700' : 'bg-emerald-50/70 text-emerald-700'
            }`}
          >
            <span className="font-semibold">
              {r.status} by {commentPerspective === 'manager' ? 'you' : r.reviewedBy ?? 'your manager'}
              {r.reviewedAt ? ` on ${r.reviewedAt}` : ''}
            </span>
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

      {(actions || onOpenComments) && (
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
              className="h-9 px-3 rounded-xl text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 active:bg-slate-100 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Comments
              {commentCount > 0 && (
                <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-blue-50 text-[#2F68FE] text-[10px] font-bold flex items-center justify-center">
                  {commentCount}
                </span>
              )}
            </button>
          )}
          {actions}
        </div>
      )}
    </article>
  );
};
