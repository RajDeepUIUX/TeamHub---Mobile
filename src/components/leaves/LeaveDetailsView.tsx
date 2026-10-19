import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Paperclip,
  Upload,
  User,
  XCircle,
  MessageSquare,
  Check,
  X,
} from 'lucide-react';
import { LeaveRequest } from '../../types/leaves';
import { LeaveReviewSheet, LeaveDecision } from './LeaveReviewSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { AttachmentInput, AttachmentInputHandle } from '../common/AttachmentInput';

interface LeaveDetailsViewProps {
  request: LeaveRequest;
  onBack: () => void;
  /** Attach a supporting document the staff member skipped while applying */
  onUploadDocument?: (id: string, fileName: string) => void;
  onCancel?: (id: string) => void;
  /** Manager reviewing a team member's request: shows the applicant and Approve / Reject instead of Edit / Cancel */
  onReview?: (ids: string[], decision: LeaveDecision, comment: string) => void;
}

const MANAGER_NOTES: Record<LeaveRequest['status'], string> = {
  Pending: 'This request is waiting for your review. The team member is notified once you approve or reject it.',
  Approved: 'You approved this request. It is locked for edits.',
  Rejected: 'You rejected this request. The team member can apply for a new leave instead.',
};

const STATUS_STYLES: Record<
  LeaveRequest['status'],
  { card: string; iconBox: string; badge: string; icon: React.ReactNode; note: string }
> = {
  Pending: {
    card: 'bg-[#FEF9EE] border-[#FDE6B8]',
    iconBox: 'bg-[#FDE9C0]/60 text-[#D97706]',
    badge: 'bg-[#FEF3C7] text-[#D97706]',
    icon: <Clock className="w-3 h-3" />,
    note: 'This request is pending approval. You can cancel it while it is pending.',
  },
  Approved: {
    card: 'bg-[#F0FDF4] border-[#BBF7D0]',
    iconBox: 'bg-[#DCFCE7] text-[#16A34A]',
    badge: 'bg-[#DCFCE7] text-[#16A34A]',
    icon: <CheckCircle2 className="w-3 h-3" />,
    note: 'This request has been approved and is locked for edits.',
  },
  Rejected: {
    card: 'bg-[#FEF2F2] border-[#FECACA]',
    iconBox: 'bg-[#FEE2E2] text-[#DC2626]',
    badge: 'bg-[#FEE2E2] text-[#DC2626]',
    icon: <XCircle className="w-3 h-3" />,
    note: 'This request was rejected by your reporting manager. You can apply for a new leave instead.',
  },
};

/** Status shown as plain coloured text with its icon (no chip) */
const STATUS_TEXT: Record<LeaveRequest['status'], string> = {
  Pending: 'text-[#D97706]',
  Approved: 'text-[#16A34A]',
  Rejected: 'text-[#DC2626]',
};

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; last?: boolean }> = ({
  icon,
  label,
  value,
  last,
}) => (
  <div className={`flex items-start justify-between gap-4 py-2.5 ${last ? '' : 'border-b border-slate-50'}`}>
    <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
      <span className="text-slate-400">{icon}</span>
      <span>{label}</span>
    </div>
    <span className="font-bold text-[#1E293B] text-right min-w-0 break-words">{value}</span>
  </div>
);

export const LeaveDetailsView: React.FC<LeaveDetailsViewProps> = ({ request, onBack, onUploadDocument, onCancel, onReview }) => {
  const [decision, setDecision] = useState<LeaveDecision | null>(null);
  const uploadRef = useRef<AttachmentInputHandle>(null);
  const isPending = request.status === 'Pending';
  const isReviewer = Boolean(onReview);
  const style = STATUS_STYLES[request.status];

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4 relative">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold text-[#1E293B] screen-title">Leave Details</h1>
        </div>
      </header>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4 no-scrollbar">
        {/* Applicant (manager review) */}
        {isReviewer && request.staffName && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3">
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(
                Number((request.staffCode ?? '').replace(/\D/g, '')) || 0
              )}`}
            >
              {initialsOf(request.staffName)}
            </span>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-[#1E293B] truncate">{request.staffName}</span>
              <span className="block text-[11px] text-slate-400">Applied on {request.appliedOn}</span>
            </div>
          </div>
        )}

        {/* Request Details */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
          <h3 className="text-sm font-bold text-[#1E293B] mb-1.5">Request Details</h3>
          <div className="text-xs">
            <DetailRow
              icon={<Calendar className="w-4 h-4" />}
              label="Leave Dates"
              value={
                <>
                  {request.dateRange}
                  <span className="block mt-0.5 text-[11px] font-semibold text-slate-500">
                    {request.daysCount} {request.daysCount > 1 ? 'days' : 'day'}
                  </span>
                </>
              }
            />
            <DetailRow
              icon={<Info className="w-4 h-4" />}
              label="Status"
              value={
                <span className={`inline-flex items-center gap-1.5 ${STATUS_TEXT[request.status]}`}>
                  {style.icon}
                  {request.status}
                </span>
              }
            />
            <DetailRow icon={<Clock className="w-4 h-4" />} label="Applied On" value={request.appliedOn} />
            <DetailRow icon={<MessageSquare className="w-4 h-4" />} label="Reason" value={request.reason} />
            {/* Description sits below its label so long text stays readable */}
            <div className="pt-2.5">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Description</span>
              </div>
              {request.description ? (
                <p className="mt-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[#334155] font-medium leading-relaxed whitespace-pre-line break-words">
                  {request.description}
                </p>
              ) : (
                <p className="mt-1.5 text-slate-400 font-medium">No description added</p>
              )}
            </div>
          </div>
        </div>

        {/* Day-wise Breakdown */}
        {request.dayItems && request.dayItems.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
            <h3 className="text-sm font-bold text-[#1E293B] px-4 pt-4 pb-2">Leave Duration</h3>
            <div className="divide-y divide-slate-50">
              {request.dayItems.map((item) => (
                <div key={item.date} className="px-4 py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="block font-bold text-[#1E293B]">{item.date}</span>
                    <span className="block text-[11px] text-slate-400">{item.dayOfWeek}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2F68FE] text-[11px] font-semibold">
                    {item.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approver (the manager is the approver in review mode) */}
        {!isReviewer && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-[#1E293B]">Approver</h3>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-[#1E293B]">{request.managerName}</span>
              <span className="block text-[11px] text-slate-400">{request.managerRole}</span>
            </div>
          </div>
        </div>
        )}

        {/* Attachment */}
        {request.attachmentName && (
          // Demo only: the file doesn't open
          <button
            type="button"
            aria-label={`Open ${request.attachmentName}`}
            className="w-full text-left bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3 active:bg-slate-50 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F68FE] shrink-0">
              <Paperclip className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] text-slate-400">Attachment</span>
              <span className="block text-xs font-bold text-[#1E293B] truncate">{request.attachmentName}</span>
            </div>
            <ArrowUpRight className="w-4.5 h-4.5 text-[#2F68FE] shrink-0" />
          </button>
        )}
        {/* Upload a document skipped while applying */}
        {!request.attachmentName && !isReviewer && request.status !== 'Rejected' && onUploadDocument && (
          <>
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              className="w-full text-left bg-white rounded-2xl border border-dashed border-blue-200 p-4 flex items-center gap-3 active:bg-blue-50/50 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F68FE] shrink-0">
                <Upload className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[#2F68FE]">Upload Document</span>
                <span className="block text-[11px] text-slate-400">Add a supporting file · PDF, JPG or PNG</span>
              </div>
            </button>
            <AttachmentInput
              ref={uploadRef}
              title="Upload Document"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadDocument(request.id, file.name);
                e.target.value = '';
              }}
            />
          </>
        )}

        {/* Manager decision (synced from the manager's Team's Leaves view) */}
        {request.status !== 'Pending' && (
          <div
            className={`rounded-2xl p-4 border text-xs leading-relaxed space-y-1.5 ${
              request.status === 'Approved'
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
            }`}
          >
            <p className="flex items-start gap-2 font-semibold">
              {request.status === 'Approved' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 mt-px" />
              )}
              <span>
                {request.status} by {isReviewer ? 'you' : request.managerName}
                {request.reviewedAt ? ` on ${request.reviewedAt}` : ''}
              </span>
            </p>
            {request.managerComment && (
              <p className="ml-6 font-normal">
                <span className="font-semibold">{request.status === 'Approved' ? 'Note' : 'Reason'}: </span>“
                {request.managerComment}”
              </p>
            )}
          </div>
        )}

        {/* Info Banner: hidden once approved (the green decision card says it all) */}
        {request.status !== 'Approved' && (
          <div className="bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <span>{isReviewer ? MANAGER_NOTES[request.status] : style.note}</span>
          </div>
        )}
      </div>

      {/* Bottom CTA Bar (only when Pending) */}
      {isPending && isReviewer && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 shrink-0 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDecision('Rejected')}
            className="h-12 rounded-xl border border-rose-200 bg-white text-rose-600 font-bold text-xs active:bg-rose-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Reject</span>
          </button>
          <button
            type="button"
            onClick={() => setDecision('Approved')}
            className="h-12 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs active:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Approve</span>
          </button>
        </div>
      )}
      {isPending && !isReviewer && onCancel && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 shrink-0">
          <button
            type="button"
            onClick={() => onCancel(request.id)}
            className="w-full h-12 rounded-xl border border-rose-200 bg-white text-rose-600 font-bold text-xs active:bg-rose-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Request</span>
          </button>
        </div>
      )}

      {isReviewer && (
        <LeaveReviewSheet
          requests={[request]}
          decision={decision}
          onClose={() => setDecision(null)}
          onConfirm={(ids, d, comment) => {
            setDecision(null);
            onReview?.(ids, d, comment);
          }}
        />
      )}
    </div>
  );
};
