import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader, fieldInputClass } from '../staff/tabs/StaffTabParts';
import { VERIFY_MIN_LENGTH } from '../data/clientBillingData';

interface Props {
  isOpen: boolean;
  /** What unlocks after verifying, e.g. "view bank details" */
  purpose: string;
  onClose: () => void;
  onVerified: () => void;
}

/** B `hrmsVerifyPasswordModal`: portal password before bank numbers are shown or a bank account is edited */
export const VerifyPasswordSheet: React.FC<Props> = ({ isOpen, purpose, onClose, onVerified }) => {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) return;
    setPassword('');
    setVisible(false);
    setError(null);
    setBusy(false);
  }, [isOpen]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const verify = () => {
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setBusy(true);
    setError(null);
    timer.current = setTimeout(() => {
      setBusy(false);
      if (password.trim().length < VERIFY_MIN_LENGTH) {
        setError('Incorrect password. Please try again.');
        setPassword('');
        inputRef.current?.focus();
        return;
      }
      onVerified();
    }, 700);
  };

  const close = busy ? () => undefined : onClose;

  return (
    <BottomSheet isOpen={isOpen} onClose={close} maxHeight="max-h-[70%]">
      <SheetHeader title="Verify Portal Password" subtitle="Sensitive payment details" onClose={close} />
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <span className="w-10 h-10 rounded-xl bg-white border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <p className="text-xs font-medium text-[#2F68FE] leading-relaxed">
            Enter your portal password to {purpose}. Details hide again after 2 minutes.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="block text-xs font-bold text-[#1E293B]">Password</span>
          <span className="relative block">
            <input
              ref={inputRef}
              type={visible ? 'text' : 'password'}
              value={password}
              autoComplete="current-password"
              autoFocus
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') verify();
              }}
              placeholder="Enter your password"
              aria-invalid={Boolean(error)}
              className={`${fieldInputClass(error ?? undefined)} pr-11`}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
            >
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </span>
          {error ? (
            <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>
          ) : (
            <p className="px-0.5 text-[11px] font-medium text-slate-400">Prototype: any password of {VERIFY_MIN_LENGTH}+ characters works.</p>
          )}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={verify}
          disabled={busy}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? 'Verifying…' : 'Verify'}
        </button>
      </div>
    </BottomSheet>
  );
};
