import React from 'react';
import { TNI_STATUS_LABEL, TniStatus } from '../data/clientTrainingNeedData';

/** Pending amber, Assigned (In-Progress) indigo, Completed green: same tones as the other Client status pills */
const STATUS_STYLE: Record<TniStatus, string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  'In-Progress': 'bg-[#EEF2FF] text-[#4F46E5]',
  Completed: 'bg-[#E8F8F0] text-[#10B981]',
};

export const TniStatusPill: React.FC<{ status: TniStatus }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${STATUS_STYLE[status]}`}>{TNI_STATUS_LABEL[status]}</span>
);
