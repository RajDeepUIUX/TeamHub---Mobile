import React from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Paperclip,
  Pencil,
  User,
  XCircle,
  MessageSquare,
  Hash,
} from 'lucide-react';
import { LeaveRequest } from '../../types/leaves';

interface LeaveDetailsViewProps {
  request: LeaveRequest;
  onBack: () => void;
  onEdit: (request: LeaveRequest) => void;
  onCancel: (id: string) => void;
}

const STATUS_STYLES: Record<
  LeaveRequest['status'],
  { card: string; iconBox: string; badge: string; icon: React.ReactNode; note: string }
> = {
  Pending: {
    card: 'bg-[#FEF9EE] border-[#FDE6B8]',
    iconBox: 'bg-[#FDE9C0]/60 text-[#D97706]',
    badge: 'bg-[#FEF3C7] text-[#D97706]',
    icon: <Clock className="w-3 h-3" />,
    note: 'This request is pending approval. You can edit or cancel it while it is pending.',
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

export const LeaveDetailsView: React.FC<LeaveDetailsViewProps> = ({ request, onBack, onEdit, onCancel }) => {
  const isPending = request.status === 'Pending';
  const style = STATUS_STYLES[request.status];
  const TypeIcon = request.type === 'Additional Leave' ? FileText : Calendar;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold text-[#1E293B] ml-2">Leave Details</h1>
        </div>
      </header>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4 no-scrollbar">
        {/* Summary Card */}
        <div className={`rounded-2xl p-4.5 flex items-center gap-3.5 border ${style.card}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.iconBox}`}>
            <TypeIcon className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-base text-[#1E293B] leading-tight">{request.type}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{request.dateRange}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${style.badge}`}>
                {style.icon}
                {request.status}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {request.daysCount} {request.daysCount > 1 ? 'days' : 'day'}
              </span>
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
          <h3 className="text-sm font-bold text-[#1E293B] mb-1.5">Request Details</h3>
          <div className="text-xs">
            <DetailRow icon={<Hash className="w-4 h-4" />} label="Request ID" value={request.id.toUpperCase()} />
            <DetailRow icon={<Calendar className="w-4 h-4" />} label="Leave Type" value={request.type} />
            <DetailRow icon={<Clock className="w-4 h-4" />} label="Applied On" value={request.appliedOn} />
            <DetailRow icon={<MessageSquare className="w-4 h-4" />} label="Reason" value={request.reason} />
            <DetailRow
              icon={<FileText className="w-4 h-4" />}
              label="Description"
              value={request.description || <span className="text-slate-400 font-medium">—</span>}
              last
            />
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

        {/* Approver */}
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

        {/* Attachment */}
        {request.attachmentName && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F68FE] shrink-0">
              <Paperclip className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] text-slate-400">Attachment</span>
              <span className="block text-xs font-bold text-[#1E293B] truncate">{request.attachmentName}</span>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <span>{style.note}</span>
        </div>
      </div>

      {/* Bottom CTA Bar (only when Pending) */}
      {isPending && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 shrink-0 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onCancel(request.id)}
            className="h-12 rounded-xl border border-rose-200 bg-white text-rose-600 font-bold text-xs hover:bg-rose-50 active:bg-rose-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Request</span>
          </button>
          <button
            type="button"
            onClick={() => onEdit(request)}
            className="h-12 rounded-xl bg-[#2F68FE] text-white font-bold text-xs shadow-xs hover:bg-[#2558E6] active:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit Request</span>
          </button>
        </div>
      )}
    </div>
  );
};
