import React, { useState } from 'react';
import { BarChart2, ChevronRight, X, Check, CheckCheck, ListChecks, LayoutGrid, Briefcase, Users, Inbox, Timer } from 'lucide-react';
import { OTRequest } from '../../types/overtime';
import { OT_DOMAINS, otPendingHours } from '../../data/overtimeData';
import { BottomSheet } from '../common/BottomSheet';
import {
  FilterIconButton,
  FilterSelection,
  TeamFilterSheet,
  activeFilterCount,
  matchesFilters,
} from '../common/TeamFilterSheet';
import { OTRequestCard } from './OTRequestView';
import { OTReviewSheet, OTDecision } from './OTReviewSheet';

interface TeamOTRequestViewProps {
  requests: OTRequest[];
  onReview: (ids: string[], decision: OTDecision, comment: string) => void;
}

/* ------------------------------ Summary sheet ------------------------------ */

const TeamOTSummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; requests: OTRequest[] }> = ({
  isOpen,
  onClose,
  requests,
}) => {
  const count = (fn: (r: OTRequest) => boolean) => requests.filter(fn).length;
  const sum = (fn: (r: OTRequest) => number) => requests.reduce((n, r) => n + fn(r), 0);
  const members = Array.from(new Set(requests.map((r) => r.staffName))).sort();

  const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
  const Tile: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color = 'text-slate-700' }) => (
    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 shadow-2xs">
      <span className="text-slate-600 font-medium truncate">{label}</span>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${color}`}>{value}</span>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Team OT Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">OT Requests · Complete Breakdown</p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar text-xs">
        <Section icon={<LayoutGrid className="w-4 h-4 text-[#2F68FE]" />} title="Requests Overview">
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Tile label="Total Requests" value={requests.length} color="text-[#1E293B]" />
            <Tile label="Pending" value={count((r) => r.status === 'Pending')} color="text-[#D97706]" />
            <Tile label="Approved" value={count((r) => r.status === 'Approved')} color="text-[#10B981]" />
            <Tile label="Rejected" value={count((r) => r.status === 'Rejected')} color="text-[#F43F5E]" />
          </div>
        </Section>
        <Section icon={<Timer className="w-4 h-4 text-[#D97706]" />} title="Hours (Approved)">
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Tile label="Extra Available" value={sum((r) => (r.status === 'Approved' ? r.extraHours ?? 0 : 0))} />
            <Tile label="Assigned" value={sum((r) => (r.status === 'Approved' ? r.assignedHours : 0))} color="text-[#10B981]" />
            <Tile label="Still to assign" value={sum((r) => (r.status === 'Approved' ? otPendingHours(r) : 0))} color="text-[#D97706]" />
          </div>
        </Section>
        <Section icon={<Briefcase className="w-4 h-4 text-[#7C3AED]" />} title="By Domain">
          <div className="grid grid-cols-2 gap-2 pt-1">
            {OT_DOMAINS.map((d) => (
              <Tile key={d} label={d} value={count((r) => r.domain === d)} />
            ))}
          </div>
        </Section>
        <Section icon={<Users className="w-4 h-4 text-[#10B981]" />} title="By Team Member">
          <div className="space-y-2 pt-1">
            {members.map((name) => {
              const pending = count((r) => r.staffName === name && r.status === 'Pending');
              return (
                <div
                  key={name}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs"
                >
                  <span className="text-slate-700 font-semibold truncate">{name}</span>
                  <span className="flex items-center gap-2 text-[11px] shrink-0">
                    {pending > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#FEF8E7] text-[#D97706] font-bold">{pending} pending</span>
                    )}
                    <span className="font-bold text-slate-700 tabular-nums">{count((r) => r.staffName === name)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
      <div className="p-4 pt-2 pb-8 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-sm shadow-xs active:bg-[#1D4ED8] cursor-pointer"
        >
          Close Summary
        </button>
      </div>
    </BottomSheet>
  );
};

/* --------------------------------- Screen --------------------------------- */

export const TeamOTRequestView: React.FC<TeamOTRequestViewProps> = ({ requests, onReview }) => {
  const [filters, setFilters] = useState<FilterSelection>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [review, setReview] = useState<{ ids: string[]; decision: OTDecision } | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const visible = requests.filter((r) =>
    matchesFilters(filters, { member: r.staffName, status: r.status, domain: r.domain, clientType: r.clientType })
  );
  const filterCount = activeFilterCount(filters);
  const countState = (s: OTRequest['status']) => requests.filter((r) => r.status === s).length;
  const selectablePending = visible.filter((r) => r.status === 'Pending');
  const allPendingSelected = selectablePending.length > 0 && selectablePending.every((r) => selectedIds.has(r.id));

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };
  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filterSections = [
    { id: 'member', label: 'Team Member', options: Array.from(new Set(requests.map((r) => r.staffName))).sort() },
    { id: 'status', label: 'Status', options: ['Pending', 'Approved', 'Rejected'] },
    { id: 'domain', label: 'Domain', options: OT_DOMAINS },
    { id: 'clientType', label: 'Client Type', options: ['Existing', 'New'] },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-8 space-y-3.5 no-scrollbar">
        {/* KPI card */}
        <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Pending', value: countState('Pending'), pill: 'bg-[#FEF8E7] text-[#D97706]' },
              { label: 'Approved', value: countState('Approved'), pill: 'bg-[#E8F8F0] text-[#10B981]' },
              { label: 'Rejected', value: countState('Rejected'), pill: 'bg-[#FDECEC] text-[#F43F5E]' },
            ].map(({ label, value, pill }) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`w-14 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${pill}`}>
                  {value}
                </div>
                <span className="text-xs text-gray-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#F1F5F9] mt-3.5 pt-3">
            <button
              type="button"
              onClick={() => setIsSummaryOpen(true)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#1E293B] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#2F68FE]" />
                View Full Summary
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* List header: Select + filter */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#1E293B]">OT Requests</span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">{visible.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {selectMode ? (
              <button
                type="button"
                onClick={exitSelectMode}
                className="h-9 px-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 active:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              selectablePending.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#2F68FE] flex items-center gap-1.5 shadow-2xs active:bg-slate-50 cursor-pointer"
                >
                  <ListChecks className="w-4 h-4" />
                  Select
                </button>
              )
            )}
            <FilterIconButton count={filterCount} onClick={() => setIsFilterOpen(true)} />
          </div>
        </div>

        {selectMode && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-[#1E40AF]">
            <span>Tap pending requests to select them</span>
            <button
              type="button"
              onClick={() => setSelectedIds(allPendingSelected ? new Set() : new Set(selectablePending.map((r) => r.id)))}
              className="font-bold text-[#2F68FE] shrink-0 cursor-pointer"
            >
              {allPendingSelected ? 'Deselect all' : `Select all pending (${selectablePending.length})`}
            </button>
          </div>
        )}

        {visible.map((r) => {
          const selectable = selectMode && r.status === 'Pending';
          return (
            <OTRequestCard
              key={r.id}
              request={r}
              showStaff
              selectable={selectable}
              selected={selectedIds.has(r.id)}
              dimmed={selectMode && !selectable}
              onToggleSelect={() => toggleSelected(r.id)}
              actions={
                r.status === 'Pending' && !selectMode ? (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReview({ ids: [r.id], decision: 'Rejected' })}
                      className="h-9 px-3.5 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold flex items-center gap-1 active:bg-rose-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setReview({ ids: [r.id], decision: 'Approved' })}
                      className="h-9 px-3.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 active:bg-emerald-700 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </div>
                ) : undefined
              }
            />
          );
        })}

        {visible.length === 0 && (
          <div className="py-12 flex flex-col items-center text-center">
            <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">
              {filterCount ? 'No requests match your filters' : 'Your team hasn’t raised any OT requests yet'}
            </p>
            {filterCount > 0 && (
              <button type="button" onClick={() => setFilters({})} className="mt-1 text-xs font-semibold text-[#2F68FE] cursor-pointer">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectMode && (
        <div className="shrink-0 px-4 pt-3 pb-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <span className="text-xs font-bold text-[#1E293B]">
              {selectedIds.size} selected
              <span className="font-medium text-slate-400"> of {selectablePending.length} pending</span>
            </span>
            {selectedIds.size > 0 && (
              <button type="button" onClick={() => setSelectedIds(new Set())} className="text-[11px] font-semibold text-slate-500 cursor-pointer">
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setReview({ ids: Array.from(selectedIds), decision: 'Rejected' })}
              className="h-12 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40 active:bg-rose-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setReview({ ids: Array.from(selectedIds), decision: 'Approved' })}
              className="h-12 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:bg-emerald-700 cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              {selectedIds.size ? `Approve ${selectedIds.size} ${selectedIds.size === 1 ? 'request' : 'requests'}` : 'Approve'}
            </button>
          </div>
        </div>
      )}

      <OTReviewSheet
        requests={review ? requests.filter((r) => review.ids.includes(r.id)) : []}
        decision={review?.decision ?? null}
        onClose={() => setReview(null)}
        onConfirm={(ids, decision, comment) => {
          setReview(null);
          exitSelectMode();
          onReview(ids, decision, comment);
        }}
      />
      <TeamFilterSheet
        isOpen={isFilterOpen}
        title="Filter Team's OT Requests"
        sections={filterSections}
        selection={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setIsFilterOpen(false);
        }}
      />
      <TeamOTSummarySheet isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} requests={requests} />
    </div>
  );
};
