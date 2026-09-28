import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AttendanceRecord } from '../../types/attendance';
import { X, MapPin, LogIn, LogOut } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

interface PunchLogsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
}

// "01:30 PM" -> minutes since midnight
const toMinutes = (time: string) => {
  const [hm, period] = time.split(' ');
  const [h, m] = hm.split(':').map(Number);
  return ((h % 12) + (period === 'PM' ? 12 : 0)) * 60 + m;
};

const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

export const PunchLogsSheet: React.FC<PunchLogsSheetProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const [cachedRecord, setCachedRecord] = useState<AttendanceRecord | null>(record);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ top: false, bottom: false });

  useEffect(() => {
    if (record) {
      setCachedRecord(record);
    }
  }, [record]);

  const activeRecord = record || cachedRecord;

  // Track whether there's more content above/below to show edge fades
  const updateScrollState = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setScrollState({
      top: el.scrollTop > 4,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.scrollTo({ top: 0 });
    // Wait for the sheet to lay out before measuring
    const id = requestAnimationFrame(updateScrollState);
    return () => cancelAnimationFrame(id);
  }, [isOpen, activeRecord, updateScrollState]);

  if (!activeRecord) return null;

  const punches = activeRecord.punches;
  const firstIn = punches.find((p) => p.type === 'IN');
  const lastOut = [...punches].reverse().find((p) => p.type === 'OUT');

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      {/* Drag Handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Sheet Header */}
      <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Punch Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {activeRecord.dayOfWeek}, {activeRecord.dateFormatted}
            <span className="text-slate-300 mx-1.5">•</span>
            {punches.length} {punches.length === 1 ? 'entry' : 'entries'}
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

      {/* Day Summary */}
      {punches.length > 0 && (
        <div className="mx-5 mb-2 grid grid-cols-2 rounded-2xl bg-slate-50 border border-slate-100 divide-x divide-slate-200/70 shrink-0">
          <div className="px-3.5 py-2.5">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">First In</span>
            <span className="block text-sm font-bold text-[#1E293B]">{firstIn?.time ?? '—'}</span>
          </div>
          <div className="px-3.5 py-2.5">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Last Out</span>
            <span className="block text-sm font-bold text-[#1E293B]">{lastOut?.time ?? '—'}</span>
          </div>
        </div>
      )}

      {/* Scrollable Timeline */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div
          ref={listRef}
          onScroll={updateScrollState}
          className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-2"
        >
          {punches.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No punches recorded for this day.</div>
          ) : (
            <ol>
              {punches.map((punch, idx) => {
                const isIn = punch.type === 'IN';
                const isLast = idx === punches.length - 1;
                const prev = punches[idx - 1];
                const session =
                  !isIn && prev?.type === 'IN' ? toMinutes(punch.time) - toMinutes(prev.time) : null;

                return (
                  <li key={punch.id} className="relative flex gap-3.5">
                    {/* Timeline rail */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isIn ? 'bg-[#E8F8F0] text-[#10B981]' : 'bg-[#FEF2F2] text-[#EF4444]'
                        }`}
                      >
                        {isIn ? <LogIn className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-slate-200" />}
                    </div>

                    {/* Row content */}
                    <div className={`flex-1 min-w-0 flex items-start justify-between gap-3 ${isLast ? 'pb-1' : 'pb-4'}`}>
                      <div className="min-w-0 pt-0.5">
                        <span className="block text-xs font-bold text-[#1E293B]">
                          Punch {isIn ? 'In' : 'Out'}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{punch.location}</span>
                        </span>
                      </div>
                      <div className="text-right shrink-0 pt-0.5">
                        <span className="block text-[13px] font-bold text-[#1E293B] tabular-nums">{punch.time}</span>
                        {session !== null && session >= 0 && (
                          <span className="block text-[10px] font-medium text-slate-400 tabular-nums">
                            {formatDuration(session)} session
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Edge fades hint that the list scrolls */}
        <div
          className={`pointer-events-none absolute top-0 inset-x-0 h-5 bg-linear-to-b from-white to-transparent transition-opacity ${
            scrollState.top ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-linear-to-t from-white to-transparent transition-opacity ${
            scrollState.bottom ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* Bottom Close Button */}
      <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
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
