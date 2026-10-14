import React, { useEffect, useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { LeaveRequest } from '../../types/leaves';
import { avatarTint, initialsOf } from '../home/celebrationUtils';

interface LeaveCommentsSheetProps {
  request: LeaveRequest | null;
  onClose: () => void;
}

/** Comments on a staff member's own leave: their description and the reporting manager's review note */
export const LeaveCommentsSheet: React.FC<LeaveCommentsSheetProps> = ({ request, onClose }) => {
  // Keep the last request so the sheet doesn't empty out while it animates closed
  const [shown, setShown] = useState<LeaveRequest | null>(request);
  useEffect(() => {
    if (request) setShown(request);
  }, [request]);

  const r = request ?? shown;
  const managerNote = r?.managerComment && r.status !== 'Pending';

  return (
    <BottomSheet isOpen={Boolean(request)} onClose={onClose} maxHeight="max-h-[80%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#1E293B]">Comments</h2>
          {r && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {r.dateRange} · {r.daysCount} {r.daysCount === 1 ? 'day' : 'days'}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {r && (
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar text-xs">
          {r.description && (
            <div className="flex gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-[#2F68FE] flex items-center justify-center text-[11px] font-bold shrink-0">
                You
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-[#1E293B]">You</span>
                  <span className="text-[11px] text-slate-400 shrink-0">{r.appliedOn}</span>
                </div>
                <p className="mt-1 px-3 py-2.5 rounded-xl rounded-tl-sm bg-slate-50 border border-slate-100 text-[#334155] leading-relaxed whitespace-pre-line break-words">
                  {r.description}
                </p>
              </div>
            </div>
          )}

          {managerNote ? (
            <div className="flex gap-3">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarTint(1)}`}
              >
                {initialsOf(r.managerName)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-[#1E293B] truncate">{r.managerName}</span>
                  {r.reviewedAt && <span className="text-[11px] text-slate-400 shrink-0">{r.reviewedAt}</span>}
                </div>
                <span
                  className={`inline-block mt-0.5 text-[10px] font-bold ${
                    r.status === 'Approved' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {r.status === 'Approved' ? 'Approved with a note' : 'Rejected'}
                </span>
                <p
                  className={`mt-1 px-3 py-2.5 rounded-xl rounded-tl-sm border leading-relaxed whitespace-pre-line break-words ${
                    r.status === 'Approved'
                      ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
                      : 'bg-rose-50/70 border-rose-100 text-rose-800'
                  }`}
                >
                  {r.managerComment}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center text-center">
              <span className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <MessageSquare className="w-5.5 h-5.5" />
              </span>
              <p className="mt-3 text-sm font-bold text-[#1E293B]">No comments from {r.managerName.split(' ')[0]} yet</p>
              <p className="mt-1 text-slate-500 leading-relaxed max-w-[240px]">
                {r.status === 'Pending'
                  ? "You'll see their note here once they review your request."
                  : 'Your request was reviewed without a note.'}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="p-4 pt-2 pb-8 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-sm shadow-xs active:bg-[#1D4ED8] cursor-pointer"
        >
          Close
        </button>
      </div>
    </BottomSheet>
  );
};
