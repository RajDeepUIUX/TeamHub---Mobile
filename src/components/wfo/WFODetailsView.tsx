import React from 'react';
import { ArrowLeft, Calendar, Info, Pencil } from 'lucide-react';
import { WFORecord } from '../../types/wfo';

interface WFODetailsViewProps {
  record: WFORecord;
  onBack: () => void;
  onEdit: (record: WFORecord) => void;
}

export const WFODetailsView: React.FC<WFODetailsViewProps> = ({
  record,
  onBack,
  onEdit,
}) => {
  const isPending = record.status === 'Pending';

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Top Header matching Image 4 */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold text-[#1E293B] ml-2">
            WFO Days Details
          </h1>
        </div>
      </header>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 space-y-4 no-scrollbar">
        {/* Top Summary Card matching Image 4 */}
        <div
          className={`rounded-2xl p-4.5 flex items-center gap-3.5 border ${
            isPending
              ? 'bg-[#FEF9EE] border-[#FDE6B8]'
              : 'bg-[#F0FDF4] border-[#BBF7D0]'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isPending
                ? 'bg-[#FDE9C0]/60 text-[#D97706]'
                : 'bg-[#DCFCE7] text-[#16A34A]'
            }`}
          >
            <Calendar className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-base text-[#1E293B] leading-tight">
              {record.monthYear}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {record.days} Days
            </p>
            <div className="mt-1.5">
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-block ${
                  isPending
                    ? 'bg-[#FEF3C7] text-[#D97706]'
                    : 'bg-[#DCFCE7] text-[#16A34A]'
                }`}
              >
                {record.status}
              </span>
            </div>
          </div>
        </div>

        {/* Submitted Details Card matching Image 4 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-[#1E293B]">
            Submitted Details
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Year</span>
              </div>
              <span className="font-bold text-[#1E293B]">{record.year}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Month</span>
              </div>
              <span className="font-bold text-[#1E293B]">{record.month}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Days</span>
              </div>
              <span className="font-bold text-[#1E293B]">{record.days}</span>
            </div>
          </div>
        </div>

        {/* Info Banner matching Image 4 */}
        <div className="bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <span>
            {isPending
              ? 'This request is pending approval. You can edit this request while it is pending.'
              : 'This request has been approved and is locked for edits.'}
          </span>
        </div>
      </div>

      {/* Sticky & Fixed Bottom CTA Bar (only when Pending) */}
      {isPending && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(record)}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-bold text-xs shadow-xs hover:bg-[#2558E6] active:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit Request</span>
          </button>
        </div>
      )}
    </div>
  );
};
