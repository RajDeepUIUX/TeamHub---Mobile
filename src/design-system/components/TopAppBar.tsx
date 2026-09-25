import React from 'react';
import { ArrowLeft, MoreVertical, X } from 'lucide-react';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  backIcon?: 'arrow' | 'close';
  rightAction?: React.ReactNode;
  rightActionLabel?: string;
  onRightAction?: () => void;
  badgeCount?: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  subtitle,
  onBack,
  showBack = false,
  backIcon = 'arrow',
  rightAction,
  rightActionLabel,
  onRightAction,
  badgeCount,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all select-none">
      {/* Left Slot: Navigation Affordance */}
      <div className="flex items-center min-w-10">
        {showBack ? (
          <button
            onClick={onBack}
            type="button"
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Navigate back"
          >
            {backIcon === 'close' ? (
              <X className="w-5 h-5" />
            ) : (
              <ArrowLeft className="w-5 h-5" />
            )}
          </button>
        ) : (
          <div className="w-2" />
        )}
      </div>

      {/* Center Slot: Screen Title & Optional Context */}
      <div className="flex-1 text-center px-2 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 truncate tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-slate-500 truncate -mt-0.5 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Slot: Contextual Action */}
      <div className="flex items-center justify-end min-w-10">
        {rightAction ? (
          rightAction
        ) : rightActionLabel ? (
          <button
            onClick={onRightAction}
            type="button"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 active:text-blue-800 px-2 py-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {rightActionLabel}
          </button>
        ) : onRightAction ? (
          <button
            onClick={onRightAction}
            type="button"
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-2" />
        )}
      </div>
    </header>
  );
};
