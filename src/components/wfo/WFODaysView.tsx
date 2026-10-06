import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Filter,
  Plus,
  Pencil,
  Eye,
  MapPin,
} from 'lucide-react';
import { WFORecord } from '../../types/wfo';
import {
  WFO_DAILY_ALLOWANCE,
  WFO_ALLOWANCE_BRANCH,
  formatINR,
  wfoAllowanceFor,
} from '../../data/wfoData';
import { FilterWFOSheet } from './FilterWFOSheet';
import { AddWFOSheet } from './AddWFOSheet';

interface WFODaysViewProps {
  /** The signed-in user's own requests */
  records: WFORecord[];
  onViewDetails: (record: WFORecord) => void;
  /** Creates a request, or updates `idToEdit` (edits go back to Pending) */
  onSubmit: (month: string, year: number, days: number, idToEdit?: string) => void;
}

export const WFODaysView: React.FC<WFODaysViewProps> = ({ records, onViewDetails, onSubmit }) => {
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<WFORecord | null>(null);

  // Filter logic
  const filteredRecords = records.filter((rec) => {
    if (filterMonth && rec.month !== filterMonth) return false;
    if (filterYear && rec.year !== filterYear) return false;
    return true;
  });

  const handleApplyFilter = (month: string | null, year: number | null) => {
    setFilterMonth(month);
    setFilterYear(year);
  };

  const handleClearFilter = () => {
    setFilterMonth(null);
    setFilterYear(null);
  };

  const activeSelectorLabel = filterMonth && filterYear
    ? `${filterMonth} ${filterYear}`
    : 'September 2026';

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Month Selector & Filter Row matching Image 1 */}
      <div className="px-4 pt-3.5 pb-1 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Quick Month Filter Selector */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 h-12 px-3.5 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-700 shadow-2xs active:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{activeSelectorLabel}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Filter Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
              filterMonth || filterYear
                ? 'bg-blue-50 border-[#2F68FE] text-[#2F68FE]'
                : 'bg-white border-slate-200/90 text-[#2F68FE] active:bg-slate-50'
            }`}
            aria-label="Filter WFO Days"
          >
            <Filter className="w-4.5 h-4.5 stroke-[1.9]" />
          </button>
        </div>
      </div>

      {/* Scrollable Records List */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-3 no-scrollbar">
        {/* Allowance eligibility note */}
        <div className="flex items-start gap-2.5 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] px-3 py-2.5 text-[11px] text-[#1E40AF] leading-relaxed">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#2563EB]" />
          <span>
            WFO allowance of <strong className="font-bold">{formatINR(WFO_DAILY_ALLOWANCE)}/day</strong> applies only to
            staff at the <strong className="font-bold">{WFO_ALLOWANCE_BRANCH}</strong>.
          </span>
        </div>

        {filteredRecords.map((record) => {
          const isPending = record.status === 'Pending';
          const isApproved = record.status === 'Approved';
          const allowance = wfoAllowanceFor(record.days);
          return (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-[#EBF0F7] px-4 py-3 shadow-2xs transition-all"
            >
              {/* Row 1: month + status | allowance */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-bold text-sm text-[#1E293B] truncate">{record.monthYear}</h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      isPending
                        ? 'bg-[#FEF3C7] text-[#D97706]'
                        : isApproved
                          ? 'bg-[#DCFCE7] text-[#16A34A]'
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
                <span
                  className={`text-base font-extrabold tabular-nums shrink-0 ${
                    isApproved ? 'text-[#16A34A]' : isPending ? 'text-slate-500' : 'text-slate-300 line-through'
                  }`}
                >
                  {formatINR(allowance)}
                </span>
              </div>

              {/* Row 2: days × rate | allowance state */}
              <div className="flex items-center justify-between gap-3 mt-1 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-500 font-medium tabular-nums">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {record.days} days × {formatINR(WFO_DAILY_ALLOWANCE)}
                </span>
                <span className={isApproved ? 'text-[#16A34A] font-medium' : 'text-slate-400'}>
                  {isApproved ? 'Allowance approved' : isPending ? 'On approval' : 'Not payable'}
                </span>
              </div>

              {/* Bottom Action Row matching Image 1 */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-3 text-xs font-semibold text-[#2F68FE]">
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRecordToEdit(record);
                        setIsAddOpen(true);
                      }}
                      className="flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <span className="text-slate-200">|</span>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => onViewDetails(record)}
                  className="flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredRecords.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
            <p className="text-xs font-medium">No WFO records found.</p>
            <button
              type="button"
              onClick={handleClearFilter}
              className="mt-2 text-xs font-semibold text-[#2F68FE] cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Sticky & Fixed Bottom CTA Bar */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <button
          type="button"
          onClick={() => {
            setRecordToEdit(null);
            setIsAddOpen(true);
          }}
          className="w-full h-12 bg-[#2F68FE] active:bg-[#1D4ED8] text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
          <span>Add WFO Days</span>
        </button>
      </div>

      {/* Filter Bottom Sheet matching Image 2 */}
      <FilterWFOSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedMonth={filterMonth}
        selectedYear={filterYear}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      {/* Add / Edit WFO Days Bottom Sheet matching Image 3 */}
      <AddWFOSheet
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setRecordToEdit(null);
        }}
        recordToEdit={recordToEdit}
        onSubmit={onSubmit}
        existingRecords={records}
      />
    </div>
  );
};
