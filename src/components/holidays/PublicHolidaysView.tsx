import React, { useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { HOLIDAYS_DATA, Holiday } from '../../data/holidayData';
import { Dropdown } from '../../design-system/components/Dropdown';

interface PublicHolidaysViewProps {
  showHeader?: boolean;
  onBack?: () => void;
}

export const PublicHolidaysView: React.FC<PublicHolidaysViewProps> = ({
  showHeader = false,
  onBack,
}) => {
  const [yearType, setYearType] = useState<'Calendar Year' | 'Financial Year'>('Calendar Year');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Filter holidays based on selected year
  const filteredHolidays = HOLIDAYS_DATA.filter((h) => h.year === selectedYear);

  // Group holidays by monthYear in chronological order
  const monthGroups = filteredHolidays.reduce((acc, holiday) => {
    if (!acc[holiday.monthYear]) {
      acc[holiday.monthYear] = [];
    }
    acc[holiday.monthYear].push(holiday);
    return acc;
  }, {} as Record<string, Holiday[]>);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Optional Top Header if used standalone */}
      {showHeader && (
        <header className="sticky top-0 z-20 bg-white border-b border-[#EBF0F7]">
          <div className="flex items-center h-14 px-4">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Back to attendance"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold text-[#1E293B] ml-2">
              Public Holidays
            </h1>
          </div>
        </header>
      )}

      {/* Scrollable Content matching the screenshot */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 space-y-4 no-scrollbar">
        {/* Filter Selectors: Year Type & Calendar Year */}
        <div className="grid grid-cols-2 gap-3">
          {/* Year Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Year Type
            </label>
            <Dropdown
              size="md"
              ariaLabel="Year Type"
              value={yearType}
              options={['Calendar Year', 'Financial Year'] as const}
              onChange={setYearType}
            />
          </div>

          {/* Calendar Year Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Calendar Year
            </label>
            <Dropdown
              size="md"
              ariaLabel="Calendar Year"
              value={selectedYear}
              options={[2026, 2025]}
              onChange={setSelectedYear}
            />
          </div>
        </div>

        {/* Organization & Team Information Card matching Screenshot */}
        <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-[20px] p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-blue-100/90 border border-blue-200/50 flex items-center justify-center text-[#2F68FE] shrink-0">
            <Building2 className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm text-[#1E293B] leading-tight">
              Product Development Team
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ahmedabad
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Division : Common
            </p>
          </div>
        </div>

        {/* Grouped Holidays List */}
        <div className="space-y-4 pt-1">
          {Object.entries(monthGroups).map(([monthYear, holidays]) => (
            <div key={monthYear} className="space-y-2">
              {/* Month Header Banner Pill */}
              <div className="bg-[#EFF6FF] rounded-lg px-3.5 py-1.5">
                <span className="text-[11px] font-bold text-[#4B79E4] uppercase tracking-wider">
                  {monthYear}
                </span>
              </div>

              {/* Holidays Card */}
              <div className="bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs divide-y divide-[#F1F5F9] overflow-hidden">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="p-3.5 flex items-center gap-3.5 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Left Date Block */}
                    <div className="w-9 text-center shrink-0">
                      <div className="text-base font-bold text-[#1E293B] leading-none">
                        {holiday.dayNumber}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 mt-1">
                        {holiday.dayOfWeek}
                      </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className="w-px h-8 bg-slate-200/80 shrink-0" />

                    {/* Right Holiday Name */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="text-xs font-semibold text-[#1E293B] leading-snug">
                        {holiday.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredHolidays.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
              <p className="text-xs font-medium">
                No holidays found for {selectedYear}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
