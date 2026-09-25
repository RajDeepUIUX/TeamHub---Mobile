import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { LEAVE_REASONS } from './ApplyLeaveView';

interface SelectReasonSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReason: string;
  onSelect: (reason: string) => void;
}

export const SelectReasonSheet: React.FC<SelectReasonSheetProps> = ({
  isOpen,
  onClose,
  selectedReason,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReasons = LEAVE_REASONS.filter((r) =>
    r.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSelectOption = (reason: string) => {
    onSelect(reason);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
      {/* Drag handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="text-base font-bold text-[#1E293B]">Select Reason</h2>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input Box */}
      <div className="p-4 pb-2 border-b border-slate-100">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reasons..."
            className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-blue-500 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 absolute right-2.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Reasons List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar max-h-[50vh]">
        {filteredReasons.map((reason) => {
          const isSelected = selectedReason === reason;
          return (
            <button
              key={reason}
              type="button"
              onClick={() => handleSelectOption(reason)}
              className={`w-full h-12 px-4 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer border ${
                isSelected
                  ? 'bg-blue-50/80 border-[#2F68FE]/30 text-[#2F68FE] font-bold shadow-2xs'
                  : 'bg-white border-transparent hover:bg-slate-50 text-slate-700 font-medium'
              }`}
            >
              <span className="text-xs">{reason}</span>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[#2F68FE] flex items-center justify-center text-white shrink-0">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
              )}
            </button>
          );
        })}

        {filteredReasons.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            No matching reasons found
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
