import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { AttendanceRecord } from '../../types/attendance';

export type AttendanceDecision = 'approved' | 'rejected';

interface AttendanceReviewSheetProps {
  record: AttendanceRecord | null;
  decision: AttendanceDecision | null;
  onClose: () => void;
  onConfirm: (id: string, decision: AttendanceDecision, comment: string) => void;
}

const MAX_CHARS = 300;

export const AttendanceReviewSheet: React.FC<AttendanceReviewSheetProps> = ({ record, decision, onClose, onConfirm }) => {
  const [cached, setCached] = useState<{ record: AttendanceRecord; decision: AttendanceDecision } | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record && decision) {
      setCached({ record, decision });
      setComment('');
      setError('');
      setSaving(false);
    }
  }, [record, decision]);

  const active = record && decision ? { record, decision } : cached;
  if (!active) return null;

  const { record: r } = active;
  const isApprove = active.decision === 'approved';

  const confirm = () => {
    // A rejection must explain why; the note on approval is optional
    if (!isApprove && !comment.trim()) {
      setError('Please give a reason for rejecting this request.');
      return;
    }
    setSaving(true);
    setTimeout(() => onConfirm(r.id, active.decision, comment.trim()), 500);
  };

  return (
    <BottomSheet isOpen={Boolean(record && decision)} onClose={onClose} maxHeight="max-h-[88%]">
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
            {isApprove ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          </span>
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">{isApprove ? 'Approve' : 'Reject'} Edit Request</h2>
            <p className="text-[11px] text-slate-400">
              {r.staffName} · {r.dayOfWeek}, {r.dateFormatted}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
        {/* Actual vs requested */}
        <div className="rounded-xl border border-slate-100 overflow-hidden text-xs">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 py-2 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Actual</span>
            <span />
            <span className="text-right">Requested</span>
          </div>
          {[
            { label: 'Office', actual: r.totalOfficeTime, requested: r.reqOfficeHrs },
            { label: 'Working', actual: r.totalWorkingTime, requested: r.reqWorkHrs },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center px-3 py-2 border-t border-slate-100">
              <span>
                <span className="block text-[10px] text-slate-400">{row.label}</span>
                <span className="font-bold text-slate-600 tabular-nums">{row.actual}</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 mx-2" />
              <span className="text-right">
                <span className="block text-[10px] text-slate-400">{row.label}</span>
                <span className="font-bold text-[#2F68FE] tabular-nums">{row.requested ?? '—'}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1E293B]">
            {isApprove ? 'Note' : 'Reason for rejection'}{' '}
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
              placeholder={isApprove ? 'Add a note for the staff member...' : 'Explain why this request is being rejected...'}
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
          className={`h-12 rounded-xl text-white text-xs font-bold disabled:opacity-60 cursor-pointer ${
            isApprove ? 'bg-emerald-600 active:bg-emerald-700' : 'bg-rose-600 active:bg-rose-700'
          }`}
        >
          {saving ? 'Saving…' : isApprove ? 'Approve' : 'Reject'}
        </button>
      </div>
    </BottomSheet>
  );
};
