import React from 'react';
import { ChevronRight, Filter, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { StatusBadge, StatusType } from './StatusBadge';

/**
 * Sticky Bottom Action Bar
 * Ergonomic thumb zone placement for single primary CTA + optional secondary
 */
interface StickyBottomActionProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  helperText?: string;
}

export const StickyBottomAction: React.FC<StickyBottomActionProps> = ({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondary,
  helperText,
}) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-4 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      {helperText && (
        <p className="text-[11px] text-slate-500 text-center mb-2 font-normal">
          {helperText}
        </p>
      )}
      <div className={`flex gap-2.5 ${secondaryLabel ? 'flex-row' : 'flex-col'}`}>
        {secondaryLabel && (
          <button
            type="button"
            onClick={onSecondary}
            className="flex-1 h-12 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || primaryLoading}
          className="flex-1 h-12 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          {primaryLoading && (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {primaryLabel}
        </button>
      </div>
    </div>
  );
};

/**
 * Segmented Control (Functional filter tabs)
 */
interface SegmentedControlOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  activeId: T;
  onChange: (id: T) => void;
}

export function SegmentedControl<T extends string = string>({
  options,
  activeId,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 select-none">
      {options.map((option) => {
        const isActive = activeId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`flex-1 min-h-[36px] py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="truncate">{option.label}</span>
            {typeof option.count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                  isActive
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Mobile Interactive Tap List Row Item
 */
interface ListRowItemProps {
  title: string;
  subtitle?: string;
  metaText?: string;
  status?: StatusType;
  statusLabel?: string;
  leftIcon?: React.ReactNode;
  rightValue?: string;
  onClick?: () => void;
  isActionable?: boolean;
}

export const ListRowItem: React.FC<ListRowItemProps> = ({
  title,
  subtitle,
  metaText,
  status,
  statusLabel,
  leftIcon,
  rightValue,
  onClick,
  isActionable = true,
}) => {
  const content = (
    <div
      onClick={onClick}
      className={`w-full min-h-[64px] px-4 py-3 bg-white border border-slate-200/70 rounded-2xl flex items-center justify-between gap-3 text-left transition-all ${
        onClick
          ? 'hover:border-slate-300 active:bg-slate-50 cursor-pointer shadow-2xs'
          : 'shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {leftIcon && (
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            {leftIcon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h4 className="text-sm font-semibold text-slate-900 truncate">
              {title}
            </h4>
            {status && (
              <StatusBadge status={status} label={statusLabel} size="sm" />
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-600 truncate">{subtitle}</p>
          )}
          {metaText && (
            <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
              <span>{metaText}</span>
            </div>
          )}
        </div>
      </div>

      {(rightValue || isActionable) && (
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {rightValue && (
            <span className="text-xs font-semibold text-slate-900 tabular-nums">
              {rightValue}
            </span>
          )}
          {isActionable && <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      )}
    </div>
  );

  return content;
};

/**
 * Mobile Clean Empty State
 */
interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200/80 rounded-2xl my-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
        {icon || <Info className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="h-10 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
