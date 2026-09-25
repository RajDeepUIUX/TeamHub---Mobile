import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../../types/attendance';
import { X, MapPin } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

interface PunchLogsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
}

export const PunchLogsSheet: React.FC<PunchLogsSheetProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const [cachedRecord, setCachedRecord] = useState<AttendanceRecord | null>(record);

  useEffect(() => {
    if (record) {
      setCachedRecord(record);
    }
  }, [record]);

  const activeRecord = record || cachedRecord;
  if (!activeRecord) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90vh]">
      {/* Drag Handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Sheet Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">
            Punch Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {activeRecord.dateFormatted.replace(',', '')}
          </p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Punch Records List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 no-scrollbar">
        {activeRecord.punches.map((punch, idx) => {
          const isPunchIn = punch.type === 'IN';
          return (
            <div
              key={punch.id}
              className="bg-white border border-[#EBF0F7] rounded-xl p-3.5 shadow-2xs flex items-start gap-3 transition-colors hover:border-slate-300"
            >
              {/* Index Number */}
              <div className="w-5 text-xs font-bold text-slate-400 pt-0.5">
                {idx + 1}.
              </div>

              {/* Punch Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isPunchIn
                          ? 'bg-[#E8F8F0] text-[#10B981]'
                          : 'bg-[#FEF2F2] text-[#EF4444]'
                      }`}
                    >
                      {punch.type}
                    </span>
                    <span className="text-xs font-bold text-[#1E293B]">
                      {punch.time}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {punch.source || 'Biometric'}
                  </span>
                </div>

                {/* Location with MapPin */}
                <div className="flex items-start gap-1.5 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-500 leading-tight">
                    {punch.location}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Close Button */}
      <div className="p-4 pt-2 pb-8 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-white border border-[#2F68FE] text-[#2F68FE] font-semibold text-xs hover:bg-blue-50/50 active:bg-blue-100 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </BottomSheet>
  );
};
