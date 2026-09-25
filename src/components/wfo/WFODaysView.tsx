import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Filter,
  Plus,
  Pencil,
  Eye,
} from 'lucide-react';
import { WFORecord } from '../../types/wfo';
import { INITIAL_WFO_RECORDS } from '../../data/wfoData';
import { FilterWFOSheet } from './FilterWFOSheet';
import { AddWFOSheet } from './AddWFOSheet';

interface WFODaysViewProps {
  onViewDetails: (record: WFORecord) => void;
}

export const WFODaysView: React.FC<WFODaysViewProps> = ({ onViewDetails }) => {
  const [records, setRecords] = useState<WFORecord[]>(INITIAL_WFO_RECORDS);
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

  const handleAddOrEditSubmit = (
    month: string,
    year: number,
    days: number,
    idToEdit?: string
  ) => {
    if (idToEdit) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === idToEdit
            ? {
                ...r,
                month,
                year,
                days,
                monthYear: `${month} ${year}`,
                status: 'Pending',
              }
            : r
        )
      );
    } else {
      const newRec: WFORecord = {
        id: `wfo-${year}-${month.toLowerCase().slice(0, 3)}-${Date.now()}`,
        month,
        year,
        monthYear: `${month} ${year}`,
        days,
        status: 'Pending',
        submittedAt: 'Just now',
      };
      setRecords((prev) => [newRec, ...prev]);
    }
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
            className="flex-1 h-12 px-3.5 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
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
                : 'bg-white border-slate-200/90 text-[#2F68FE] hover:bg-slate-50'
            }`}
            aria-label="Filter WFO Days"
          >
            <Filter className="w-4.5 h-4.5 stroke-[1.9]" />
          </button>
        </div>
      </div>

      {/* Scrollable Records List */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-3 no-scrollbar">
        {filteredRecords.map((record) => {
          const isPending = record.status === 'Pending';
          return (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-[#EBF0F7] p-4 shadow-2xs transition-all hover:border-slate-300"
            >
              {/* Top Row: Month Year + Status Pill */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1E293B]">
                  {record.monthYear}
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    isPending
                      ? 'bg-[#FEF3C7] text-[#D97706]'
                      : 'bg-[#DCFCE7] text-[#16A34A]'
                  }`}
                >
                  {record.status}
                </span>
              </div>

              {/* Days Count */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{record.days} Days</span>
              </div>

              {/* Bottom Action Row matching Image 1 */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-3 text-xs font-semibold text-[#2F68FE]">
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRecordToEdit(record);
                        setIsAddOpen(true);
                      }}
                      className="flex items-center gap-1.5 hover:text-[#204DBF] transition-colors cursor-pointer"
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
                  className="flex items-center gap-1.5 hover:text-[#204DBF] transition-colors cursor-pointer"
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
              className="mt-2 text-xs font-semibold text-[#2F68FE] hover:underline cursor-pointer"
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
          className="w-full h-12 bg-[#2F68FE] hover:bg-[#2558E6] active:bg-[#1D4ED8] text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
        onSubmit={handleAddOrEditSubmit}
      />
    </div>
  );
};
