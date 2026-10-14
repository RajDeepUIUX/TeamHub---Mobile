import React, { useEffect, useState } from 'react';
import { X, CheckCheck, XCircle } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { AttendanceRecord } from '../../types/attendance';
import { AttendanceDecision } from './AttendanceReviewSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';

interface BulkReviewSheetProps {
  records: AttendanceRecord[];
  decision: AttendanceDecision | null;
  onClose: () => void;
  onConfirm: (ids: string[], decision: AttendanceDecision, comment: string) => void;
}

const MAX_CHARS = 300;

export const BulkReviewSheet: React.FC<BulkReviewSheetProps> = ({ records, decision, onClose, onConfirm }) => {
  const [cached, setCached] = useState<{ records: AttendanceRecord[]; decision: AttendanceDecision } | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isOpen = Boolean(decision && records.length);

  useEffect(() => {
    if (decision && records.length) {
      setCached({ records, decision });
      setComment('');
      setError('');
      setSaving(false);
    }
    // Snapshot only when the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision]);

  const active = isOpen && decision ? { records, decision } : cached;
  if (!active) return null;

  const isApprove = active.decision === 'approved';
  const n = active.records.length;

  const confirm = () => {
    if (!isApprove && !comment.trim()) {
      setError('Please give a reason — it will be shared with every selected staff member.');
      return;
    }
    setSaving(true);
    setTimeout(() => onConfirm(active.records.map((r) => r.id), active.decision, comment.trim()), 600);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <span
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isApprove ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isApprove ? <CheckCheck className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          </span>
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">
              {isApprove ? 'Approve' : 'Reject'} {n} {n === 1 ? 'request' : 'requests'}?
            </h2>
            <p className="text-[11px] text-slate-400">
              {isApprove ? 'Selected days will be marked as Full Day (Approved).' : 'Staff will see your reason on their card.'}
            </p>
          </div>
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
        {/* Selected requests */}
        <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {active.records.map((r) => {
            const idx = Number((r.staffCode ?? '').replace(/\D/g, '')) || 0;
            return (
              <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarTint(idx)}`}>
                  {initialsOf(r.staffName)}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-[#1E293B] truncate">{r.staffName}</span>
                  <span className="block text-[10.5px] text-slate-400 truncate">
                    {r.dayOfWeek.slice(0, 3)}, {r.dateFormatted} · {r.editReason}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#2F68FE] tabular-nums shrink-0">{r.reqOfficeHrs}</span>
              </li>
            );
          })}
        </ul>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1E293B]">
            {isApprove ? 'Note for all' : 'Reason for rejection'}{' '}
            {isApprove ? <span className="font-medium text-slate-400">(Optional)</span> : <span className="text-rose-500">*</span>}
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={comment}
              maxLength={MAX_CHARS}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              placeholder={isApprove ? 'Add a note shared with each staff member...' : 'Explain why these requests are being rejected...'}
              className={`w-full p-3.5 pb-7 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text ${
                error ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 pointer-events-none tabular-nums">
              {comment.length}/{MAX_CHARS}
            </span>
          </div>
          {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={saving}
          className={`h-12 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer ${
            isApprove ? 'bg-emerald-600 active:bg-emerald-700' : 'bg-rose-600 active:bg-rose-700'
          }`}
        >
          {saving ? 'Saving…' : isApprove ? `Approve ${n}` : `Reject ${n}`}
        </button>
      </div>
    </BottomSheet>
  );
};
