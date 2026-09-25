import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  primaryActionLoading?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  dangerAction?: boolean;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled = false,
  primaryActionLoading = false,
  secondaryActionLabel,
  onSecondaryAction,
  dangerAction = false,
  maxHeight = 'max-h-[88vh]',
}) => {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-300 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Modal Box */}
      <div
        className={`relative z-10 w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col ${maxHeight} animate-in slide-in-from-bottom duration-300`}
      >
        {/* Drag Handle Indicator */}
        <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="pr-4">
            <h2 id="sheet-title" className="text-base font-semibold text-slate-900 leading-snug">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 font-normal leading-normal">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Close sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {children}
        </div>

        {/* Sticky Action Footer */}
        {(primaryActionLabel || secondaryActionLabel) && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 pb-6 space-y-2">
            {primaryActionLabel && (
              <button
                type="button"
                onClick={onPrimaryAction}
                disabled={primaryActionDisabled || primaryActionLoading}
                className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center transition-all ${
                  dangerAction
                    ? 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-300'
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-300'
                } disabled:cursor-not-allowed shadow-sm`}
              >
                {primaryActionLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  primaryActionLabel
                )}
              </button>
            )}

            {secondaryActionLabel && (
              <button
                type="button"
                onClick={onSecondaryAction || onClose}
                className="w-full h-11 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              >
                {secondaryActionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
