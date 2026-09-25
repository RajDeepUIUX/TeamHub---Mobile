import React from 'react';
import { X, Check } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { LeaveDurationType } from '../../types/leaves';

interface SelectDurationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDuration: LeaveDurationType;
  onSelect: (duration: LeaveDurationType) => void;
  targetDayLabel?: string; // Optional context, e.g. "for 20 Oct 2026"
}

export const SelectDurationSheet: React.FC<SelectDurationSheetProps> = ({
  isOpen,
  onClose,
  selectedDuration,
  onSelect,
  targetDayLabel,
}) => {
  const durationOptions: LeaveDurationType[] = [
    '2 Hours',
    '4 Hours',
    '6 Hours',
    'Full Day',
  ];

  const handleSelectOption = (opt: LeaveDurationType) => {
    onSelect(opt);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[75%]">
      {/* Drag handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Select leave duration</h2>
          {targetDayLabel && (
            <p className="text-[11px] text-slate-400 mt-0.5">{targetDayLabel}</p>
          )}
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

      {/* Options List matching Image 7 */}
      <div className="p-5 pb-8 space-y-2">
        {durationOptions.map((opt) => {
          const isSelected = selectedDuration === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelectOption(opt)}
              className={`w-full h-12.5 px-4 rounded-xl flex items-center gap-3.5 transition-all text-left cursor-pointer border ${
                isSelected
                  ? 'bg-blue-50/80 border-[#2F68FE]/30 text-[#1E293B] shadow-2xs'
                  : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
              }`}
            >
              {/* Radio circle */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                  isSelected
                    ? 'border-[#2F68FE] bg-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2F68FE]" />
                )}
              </div>

              <span className={`text-xs font-semibold ${isSelected ? 'text-[#2F68FE]' : 'text-slate-700'}`}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};
