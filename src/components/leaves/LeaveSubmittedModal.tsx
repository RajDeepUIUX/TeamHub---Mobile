import React, { useEffect } from 'react';
import { Calendar, Check } from 'lucide-react';
import { LeaveRequest } from '../../types/leaves';

interface LeaveSubmittedModalProps {
  request: LeaveRequest | null;
  requestCode: string;
  appliedAt: string;
  onDone: () => void;
  autoCloseMs?: number;
}

// Decorative confetti dots around the success icon
const CONFETTI = [
  { top: '8%', left: '22%', color: 'bg-amber-400', size: 'w-1.5 h-1.5' },
  { top: '18%', left: '12%', color: 'bg-rose-400', size: 'w-1 h-1' },
  { top: '4%', left: '38%', color: 'bg-[#2F68FE]', size: 'w-1 h-1' },
  { top: '10%', left: '68%', color: 'bg-emerald-400', size: 'w-1.5 h-1.5' },
  { top: '2%', left: '58%', color: 'bg-violet-400', size: 'w-1 h-1' },
  { top: '22%', left: '84%', color: 'bg-amber-400', size: 'w-1 h-1' },
  { top: '30%', left: '18%', color: 'bg-[#2F68FE]', size: 'w-1 h-1' },
  { top: '28%', left: '78%', color: 'bg-rose-400', size: 'w-1.5 h-1.5' },
];

export const LeaveSubmittedModal: React.FC<LeaveSubmittedModalProps> = ({
  request,
  requestCode,
  appliedAt,
  onDone,
  autoCloseMs = 3000,
}) => {
  // Auto-navigate back to the leave listing after a few seconds
  useEffect(() => {
    if (!request) return;
    const timer = setTimeout(onDone, autoCloseMs);
    return () => clearTimeout(timer);
  }, [request, onDone, autoCloseMs]);

  if (!request) return null;

  return (
    <div
      className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center px-6 animate-in fade-in duration-200"
      onClick={onDone}
    >
      <div
        className="w-full bg-white rounded-3xl p-5 shadow-xl text-[#1E293B] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon with confetti */}
        <div className="relative h-24 flex items-center justify-center">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className={`absolute rounded-full ${c.color} ${c.size}`}
              style={{ top: c.top, left: c.left }}
            />
          ))}
          <div className="w-16 h-16 rounded-full bg-[#10B981] flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.35)] ring-8 ring-emerald-50">
            <Check className="w-8 h-8 text-white stroke-[3]" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1 mt-1">
          <h2 className="text-base font-extrabold">Leave Request Submitted!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your leave request has been successfully submitted for approval.
          </p>
        </div>

        {/* Leave summary */}
        <div className="mt-4 p-3 bg-slate-50 border border-[#EBF0F7] rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F68FE] shrink-0">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold">{request.type}</span>
              <span className="block text-[11px] text-slate-500 truncate">{request.dateRange}</span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F0] text-[#10B981] shrink-0">
            {request.daysCount} {request.daysCount > 1 ? 'Days' : 'Day'}
          </span>
        </div>

        {/* Details */}
        <div className="mt-3 space-y-2.5 text-xs px-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Request ID</span>
            <span className="font-bold">{requestCode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Applied On</span>
            <span className="font-bold">{appliedAt}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF8E7] text-[#D97706] border border-amber-200/50">
              {request.status}
            </span>
          </div>
        </div>

        {/* Auto-redirect hint with progress */}
        <div className="mt-4 space-y-1.5">
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2F68FE] rounded-full origin-left"
              style={{ animation: `leave-submitted-progress ${autoCloseMs}ms linear forwards` }}
            />
          </div>
          <p className="text-center text-[10px] text-slate-400">Returning to your leaves…</p>
        </div>
        <style>{`@keyframes leave-submitted-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
      </div>
    </div>
  );
};
