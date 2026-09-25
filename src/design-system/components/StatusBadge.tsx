import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, MinusCircle } from 'lucide-react';

export type StatusType = 'approved' | 'pending' | 'rejected' | 'draft' | 'overdue' | 'active';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<StatusType, { text: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  approved: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200/80',
    icon: CheckCircle2,
  },
  pending: {
    text: 'text-amber-800',
    bg: 'bg-amber-50/90',
    border: 'border-amber-200/90',
    icon: Clock,
  },
  rejected: {
    text: 'text-rose-700',
    bg: 'bg-rose-50/80',
    border: 'border-rose-200/80',
    icon: XCircle,
  },
  overdue: {
    text: 'text-red-700',
    bg: 'bg-red-50/90',
    border: 'border-red-200',
    icon: AlertCircle,
  },
  draft: {
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: MinusCircle,
  },
  active: {
    text: 'text-blue-700',
    bg: 'bg-blue-50/80',
    border: 'border-blue-200/80',
    icon: CheckCircle2,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const config = statusConfig[status] || statusConfig.draft;
  const IconComponent = config.icon;
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.bg} ${config.border} ${config.text} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <IconComponent className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};
