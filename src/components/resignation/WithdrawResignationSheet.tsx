import React, { useEffect, useState } from 'react';
import { X, Undo2 } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

interface WithdrawResignationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (reason: string) => void;
}

const MAX_CHARS = 500;

export const WithdrawResignationSheet: React.FC<WithdrawResignationSheetProps> = ({ isOpen, onClose, onWithdraw }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      setSaving(false);
    }
  }, [isOpen]);

  const handleWithdraw = () => {
    if (!reason.trim()) {
      setError('Please share a reason for withdrawing.');
      return;
    }
    setSaving(true);
    setTimeout(() => onWithdraw(reason.trim()), 600);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Withdraw Resignation</h2>
          <p className="text-[11px] text-slate-400">Glad to have you stay — tell us what changed.</p>
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

      <div className="px-5 py-4 space-y-1.5">
        <label className="block text-xs font-bold text-[#1E293B]">
          Reason <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <textarea
            rows={4}
            value={reason}
            maxLength={MAX_CHARS}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Write your reason..."
            className={`w-full p-3.5 pb-7 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none ${
              error ? 'border-rose-300' : 'border-slate-200'
            }`}
          />
          <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 pointer-events-none tabular-nums">
            {reason.length}/{MAX_CHARS}
          </span>
        </div>
        {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={saving}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
          {saving ? 'Withdrawing…' : 'Withdraw'}
        </button>
      </div>
    </BottomSheet>
  );
};
