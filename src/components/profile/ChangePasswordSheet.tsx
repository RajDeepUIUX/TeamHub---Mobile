import React, { useEffect, useState } from 'react';
import { X, Lock, Check } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { AuthInput, demoPassword } from '../auth/AuthPrimitives';
import { strengthOf, STRENGTH_META } from '../auth/AuthFlow';

interface ChangePasswordSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export const ChangePasswordSheet: React.FC<ChangePasswordSheetProps> = ({ isOpen, onClose, onChanged }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);

  // Fresh form every time the sheet opens
  useEffect(() => {
    if (isOpen) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setErrors({});
      setSaving(false);
    }
  }, [isOpen]);

  const strength = strengthOf(next);
  const meta = STRENGTH_META[strength];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!current) errs.current = 'Enter your current password.';
    if (next.length < 8) errs.next = 'Password must be at least 8 characters.';
    else if (next === current) errs.next = 'New password must be different from the current one.';
    if (confirm !== next) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setTimeout(onChanged, 800);
  };

  const quickFill = () => {
    const pw = demoPassword();
    setCurrent(demoPassword());
    setNext(pw);
    setConfirm(pw);
    setErrors({});
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Change Password</h2>
          <p className="text-[11px] text-slate-400">Use a strong password you don't use elsewhere.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={quickFill}
            className="h-8 px-2.5 rounded-full text-[11px] font-semibold text-[#4F46E5] bg-indigo-50 active:bg-indigo-100 cursor-pointer"
          >
            Quick Fill
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col" noValidate>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3.5">
          <AuthInput
            icon={<Lock className="w-5 h-5" />}
            type="password"
            placeholder="Current Password"
            autoComplete="current-password"
            value={current}
            error={errors.current}
            onChange={(e) => {
              setCurrent(e.target.value);
              if (errors.current) setErrors((p) => ({ ...p, current: undefined }));
            }}
          />
          <div>
            <AuthInput
              icon={<Lock className="w-5 h-5" />}
              type="password"
              placeholder="New Password"
              autoComplete="new-password"
              value={next}
              error={errors.next}
              onChange={(e) => {
                setNext(e.target.value);
                if (errors.next) setErrors((p) => ({ ...p, next: undefined }));
              }}
            />
            {!errors.next && (
              <div className="mt-2 px-1">
                <p className={`text-xs font-medium ${meta.text}`}>{meta.label}</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5 w-2/3">
                  {[1, 2, 3].map((seg) => (
                    <span
                      key={seg}
                      className={`h-1.5 rounded-full transition-colors ${strength >= seg ? meta.bar : 'bg-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <AuthInput
              icon={<Lock className="w-5 h-5" />}
              type="password"
              placeholder="Confirm New Password"
              autoComplete="new-password"
              value={confirm}
              error={errors.confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
              }}
            />
            {confirm && confirm === next && !errors.confirm && (
              <p className="mt-1.5 px-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <Check className="w-3.5 h-3.5" /> Passwords match
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] font-bold text-xs bg-white active:bg-blue-50/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-xl bg-[#2F68FE] text-white font-bold text-xs active:bg-[#2558E6] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
