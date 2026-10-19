import React from 'react';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import type { ClientStaffStatus } from '../data/clientStaffData';

const STATUS_STYLE: Record<ClientStaffStatus, string> = {
  Active: 'bg-[#E8F8F0] text-[#10B981]',
  'On Notice': 'bg-[#FEF8E7] text-[#D97706]',
  'Offboarding In-Progress': 'bg-[#FEF2F2] text-rose-600',
  'Replacement In-Progress': 'bg-[#EEF2FF] text-[#4F46E5]',
  Inactive: 'bg-slate-100 text-slate-500',
};

/** Short label for chips / pills where the desktop label is too long */
export const STATUS_SHORT: Record<ClientStaffStatus, string> = {
  Active: 'Active',
  'On Notice': 'On Notice',
  'Offboarding In-Progress': 'Offboarding',
  'Replacement In-Progress': 'Replacement',
  Inactive: 'Inactive',
};

export const StaffStatusPill: React.FC<{ status: ClientStaffStatus; full?: boolean }> = ({ status, full }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap ${STATUS_STYLE[status]}`}
    title={status}
  >
    {full ? status : STATUS_SHORT[status]}
  </span>
);

export const StaffAvatar: React.FC<{ name: string; tint: number; size?: 'md' | 'lg' }> = ({ name, tint, size = 'md' }) => (
  <span
    className={`rounded-full flex items-center justify-center font-bold shrink-0 ${avatarTint(tint)} ${
      size === 'lg' ? 'w-16 h-16 text-lg' : 'w-10 h-10 text-[12px]'
    }`}
    aria-hidden="true"
  >
    {initialsOf(name)}
  </span>
);

export const StaffSkeleton: React.FC<{ className: string }> = ({ className }) => (
  <span className={`block rounded-lg bg-slate-200/70 animate-pulse ${className}`} />
);
