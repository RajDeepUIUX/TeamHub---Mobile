import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, Paperclip } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { ResignationRecord, ReviewDecision } from '../../types/resignation';
import { formatResignationDate } from '../../data/resignationData';

/* ---------------------------- Approve / Reject ---------------------------- */

interface ReviewResignationSheetProps {
  record: ResignationRecord | null;
  decision: ReviewDecision | null;
  onClose: () => void;
  onConfirm: (id: string, decision: ReviewDecision, comment: string) => void;
}

const MAX_CHARS = 300;

export const ReviewResignationSheet: React.FC<ReviewResignationSheetProps> = ({ record, decision, onClose, onConfirm }) => {
  const [cached, setCached] = useState<{ record: ResignationRecord; decision: ReviewDecision } | null>(null);
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

  const isApprove = active.decision === 'Approved';

  const handleConfirm = () => {
    // A rejection needs an explanation for the staff member; approval comment is optional
    if (!isApprove && !comment.trim()) {
      setError('Please add a comment so the staff member knows why.');
      return;
    }
    setSaving(true);
    setTimeout(() => onConfirm(active.record.id, active.decision, comment.trim()), 500);
  };

  return (
    <BottomSheet isOpen={Boolean(record && decision)} onClose={onClose} maxHeight="max-h-[85%]">
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
            <h2 className="text-base font-bold text-[#1E293B]">{isApprove ? 'Approve' : 'Reject'} Resignation</h2>
            <p className="text-[11px] text-slate-400">
              {active.record.staffName} · {active.record.staffCode}
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

      <div className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-2 rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-200/70 text-xs">
          <div className="p-3">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Resigned on</span>
            <span className="block font-bold text-[#1E293B] mt-0.5">{formatResignationDate(active.record.resignationDate)}</span>
          </div>
          <div className="p-3">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Last day</span>
            <span className="block font-bold text-[#1E293B] mt-0.5">{formatResignationDate(active.record.lastWorkingDate)}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1E293B]">
            Comment {isApprove ? <span className="font-medium text-slate-400">(Optional)</span> : <span className="text-rose-500">*</span>}
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
              placeholder={isApprove ? 'Add a note for the staff member...' : 'Explain why this resignation is being rejected...'}
              className={`w-full p-3.5 pb-7 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none ${
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
          onClick={handleConfirm}
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

/* ------------------------------ Letter viewer ------------------------------ */

export const ResignationLetterSheet: React.FC<{ record: ResignationRecord | null; onClose: () => void }> = ({
  record,
  onClose,
}) => {
  const [cached, setCached] = useState<ResignationRecord | null>(record);
  useEffect(() => {
    if (record) setCached(record);
  }, [record]);
  const active = record || cached;
  if (!active) return null;

  return (
    <BottomSheet isOpen={Boolean(record)} onClose={onClose} maxHeight="max-h-[85%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Resignation Email</h2>
          <p className="text-[11px] text-slate-400">
            From {active.staffName} · {formatResignationDate(active.resignationDate)}
          </p>
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
        <p className="text-[12.5px] text-slate-600 leading-relaxed whitespace-pre-line">{active.emailContent}</p>
        {active.attachments.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="block text-[11px] font-semibold text-slate-500">Attachments</span>
            {active.attachments.map((name) => (
              <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-100 text-xs">
                <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-medium text-slate-700">{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Close
        </button>
      </div>
    </BottomSheet>
  );
};
