import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Info,
  Plus,
  User,
  Filter,
  Eye,
  Pencil,
} from 'lucide-react';
import { LeaveRequest, LeaveBalance } from '../../types/leaves';
import { FilterLeavesSheet } from './FilterLeavesSheet';

interface LeavesViewProps {
  balance: LeaveBalance;
  requests: LeaveRequest[];
  onApplyLeaveClick: () => void;
  onCancelRequest?: (id: string) => void;
  onViewDetails?: (request: LeaveRequest) => void;
  onEditRequest?: (request: LeaveRequest) => void;
  onShowBalanceInfo?: () => void;
}

export const LeavesView: React.FC<LeavesViewProps> = ({
  balance,
  requests,
  onApplyLeaveClick,
  onCancelRequest,
  onViewDetails,
  onEditRequest,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);

  // Filtered requests
  const filteredRequests = requests.filter((req) => {
    if (filterStatus === 'All') return true;
    return req.status === filterStatus;
  });

  // Sorted requests (newest first)
  const sortedRequests = [...filteredRequests].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF8E7] text-[#D97706] border border-amber-200/50">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F0] text-[#10B981] border border-emerald-200/50">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#EF4444] border border-rose-200/50">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
    }
  };

  const getTypeIcon = (type: LeaveRequest['type']) => {
    if (type === 'Additional Leave') {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <FileText className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F68FE] shrink-0">
        <Calendar className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none relative">
      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-20 space-y-4 no-scrollbar">
        {/* 1. Leave Balance Card matching Image 1 */}
        <div className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#1E293B]">Leave Balance</span>
              <button
                type="button"
                onClick={() => setShowBalanceInfo(!showBalanceInfo)}
                className="w-4 h-4 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Balance Info Tooltip */}
          {showBalanceInfo && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-[#2F68FE] leading-relaxed animate-in fade-in duration-200">
              Paid Time Off (PTO) accrues monthly. Unused balance rolls over up to 18 days per fiscal year.
            </div>
          )}

          {/* 3 Columns: PTO | OT | Additional Leave */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 pt-0.5">
            {/* PTO */}
            <div className="pr-2 space-y-1">
              <span className="text-xs font-semibold text-slate-500 block">PTO</span>
              <div className="text-base font-extrabold text-[#1E293B] leading-none">
                {balance.ptoAvailable} <span className="text-xs font-bold text-slate-700">days</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal block">
                of {balance.ptoTotal} days
              </span>
            </div>

            {/* OT */}
            <div className="px-3 space-y-1">
              <span className="text-xs font-semibold text-slate-500 block">OT</span>
              <div className="text-base font-extrabold text-[#1E293B] leading-none">
                {balance.otHours} <span className="text-xs font-bold text-slate-700">hrs</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal block">Available</span>
            </div>

            {/* Additional Leave */}
            <div className="pl-3 space-y-1">
              <span className="text-xs font-semibold text-slate-500 block">Additional Leave</span>
              <div className="text-base font-extrabold text-[#1E293B] leading-none">
                {balance.additionalDays} <span className="text-xs font-bold text-slate-700">days</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal block">Available</span>
            </div>
          </div>
        </div>

        {/* 2. Leave Requests Section Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <h2 className="text-sm font-bold text-[#1E293B]">Leave Requests</h2>

          {/* Only Filter Icon matching WFO Days tab */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
              filterStatus !== 'All' || dateRangeFilter
                ? 'bg-blue-50 border-[#2F68FE] text-[#2F68FE]'
                : 'bg-white border-slate-200/90 text-[#2F68FE] hover:bg-slate-50'
            }`}
            aria-label="Filter Leaves"
          >
            <Filter className="w-4.5 h-4.5 stroke-[1.9]" />
          </button>
        </div>

        {/* 3. Leave Requests Cards matching Image 1 */}
        <div className="space-y-3">
          {sortedRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => onViewDetails?.(req)}
              className={`bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs space-y-3 relative hover:border-slate-300 transition-colors cursor-pointer ${
                activeMenuId === req.id ? 'z-30' : ''
              }`}
            >
              {/* Top Row: Icon + Title/Dates + Status Badge + Menu */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {getTypeIcon(req.type)}
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B] leading-snug">
                      {req.type}
                    </h3>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      {req.dateRange}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(req.status)}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === req.id ? null : req.id);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      activeMenuId === req.id
                        ? 'bg-blue-50 text-[#2F68FE]'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                    aria-label="Options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Menu */}
              {activeMenuId === req.id && (
                <>
                  {/* Click-away layer */}
                  <div
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(null);
                    }}
                  />
                  <div
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-3 top-12 z-20 w-44 bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)] text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActiveMenuId(null);
                        onViewDetails?.(req);
                      }}
                      className="w-full h-10 px-3 rounded-xl flex items-center gap-2.5 text-left text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-slate-400" />
                      <span>View Details</span>
                    </button>
                    {req.status === 'Pending' && onEditRequest && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setActiveMenuId(null);
                          onEditRequest(req);
                        }}
                        className="w-full h-10 px-3 rounded-xl flex items-center gap-2.5 text-left text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 text-slate-400" />
                        <span>Edit Request</span>
                      </button>
                    )}
                    {req.status === 'Pending' && onCancelRequest && (
                      <>
                        <div className="my-1 mx-2 border-t border-slate-100" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onCancelRequest(req.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full h-10 px-3 rounded-xl flex items-center gap-2.5 text-left text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Cancel Request</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Middle Row: Duration & Reason */}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-bold text-[#1E293B]">
                  {req.daysCount} {req.daysCount > 1 ? 'days' : 'day'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 truncate">{req.reason}</span>
              </div>

              {/* Bottom Row: Manager & Applied Date */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-[#1E293B] leading-tight">
                      {req.managerName}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {req.managerRole}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 font-normal">
                  Applied on {req.appliedOn.replace('Applied on ', '')}
                </span>
              </div>
            </div>
          ))}

          {sortedRequests.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-500">
              <p className="text-xs font-medium">No leave requests found for &quot;{filterStatus}&quot;.</p>
              <button
                type="button"
                onClick={() => setFilterStatus('All')}
                className="mt-2 text-xs font-semibold text-[#2F68FE] hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom Sticky Action Bar matching Image 1 */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 shrink-0">
        {/* Apply for Leave Primary CTA Button */}
        <button
          type="button"
          onClick={onApplyLeaveClick}
          className="w-full h-12 rounded-xl bg-[#2F68FE] hover:bg-[#2558E6] active:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Filter Leaves Bottom Sheet matching Image 2 & Image 3 */}
      <FilterLeavesSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        currentStatus={filterStatus}
        onApply={(st, range) => {
          setFilterStatus(st);
          setDateRangeFilter(range);
        }}
        onClear={() => {
          setFilterStatus('All');
          setDateRangeFilter('');
        }}
      />
    </div>
  );
};
