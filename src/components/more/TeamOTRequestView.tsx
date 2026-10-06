import React, { useState } from 'react';
import { BarChart2, ChevronRight, X, LayoutGrid, Briefcase, Users, Inbox, Timer, Eye } from 'lucide-react';
import { OTRequest } from '../../types/overtime';
import { OT_DOMAINS, otPendingHours } from '../../data/overtimeData';
import { BottomSheet } from '../common/BottomSheet';
import { FilterSelection, TeamFilterBar, TeamFilterSheet, activeFilterCount, matchesFilters } from '../common/TeamFilterSheet';
import { OTRequestCard } from './OTRequestView';

interface TeamOTRequestViewProps {
  requests: OTRequest[];
}

const totalExtra = (list: OTRequest[]) => list.reduce((n, r) => n + (r.extraHours ?? 0), 0);
const totalAssigned = (list: OTRequest[]) => list.reduce((n, r) => n + r.assignedHours, 0);
const totalPending = (list: OTRequest[]) => list.reduce((n, r) => n + otPendingHours(r), 0);

/* ------------------------------ Summary sheet ------------------------------ */

const TeamOTSummarySheet: React.FC<{ isOpen: boolean; onClose: () => void; requests: OTRequest[] }> = ({
  isOpen,
  onClose,
  requests,
}) => {
  const count = (fn: (r: OTRequest) => boolean) => requests.filter(fn).length;
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
        <Section icon={<LayoutGrid className="w-4 h-4 text-[#2F68FE]" />} title="Overview">
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Tile label="Team members" value={members.length} color="text-[#1E293B]" />
            <Tile label="Existing clients" value={count((r) => r.clientType === 'Existing')} />
            <Tile label="New clients" value={count((r) => r.clientType === 'New')} />
          </div>
        </Section>
        <Section icon={<Timer className="w-4 h-4 text-[#D97706]" />} title="Hours">
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Tile label="Extra Available" value={totalExtra(requests)} color="text-[#2F68FE]" />
            <Tile label="Assigned" value={totalAssigned(requests)} color="text-[#10B981]" />
            <Tile label="Still to assign" value={totalPending(requests)} color="text-[#D97706]" />
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
              const mine = requests.filter((r) => r.staffName === name);
              return (
                <div
                  key={name}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs"
                >
                  <span className="text-slate-700 font-semibold truncate">{name}</span>
                  <span className="text-[11px] font-bold text-slate-700 tabular-nums shrink-0">{totalExtra(mine)} extra hrs</span>
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

/** Manager's view-only list of the team's OT requests (they're auto-approved, so there's nothing to action) */
export const TeamOTRequestView: React.FC<TeamOTRequestViewProps> = ({ requests }) => {
  const [filters, setFilters] = useState<FilterSelection>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const visible = requests.filter((r) =>
    matchesFilters(filters, { member: r.staffName, domain: r.domain, clientType: r.clientType })
  );
  const filterCount = activeFilterCount(filters);

  const filterSections = [
    { id: 'member', label: 'Team Member', options: Array.from(new Set(requests.map((r) => r.staffName))).sort() },
    { id: 'domain', label: 'Domain', options: OT_DOMAINS },
    { id: 'clientType', label: 'Client Type', options: ['Existing', 'New'] },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-8 space-y-3.5 no-scrollbar">
        {/* Filters on top */}
        <TeamFilterBar selection={filters} placeholder="All team members" onClick={() => setIsFilterOpen(true)} />

        {/* KPI card: hours across the (filtered) team */}
        <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Extra Available', value: totalExtra(visible), pill: 'bg-[#EFF6FF] text-[#2F68FE]' },
              { label: 'Assigned', value: totalAssigned(visible), pill: 'bg-[#E8F8F0] text-[#10B981]' },
              { label: 'Pending', value: totalPending(visible), pill: 'bg-[#FEF8E7] text-[#D97706]' },
            ].map(({ label, value, pill }) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`w-14 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${pill}`}>
                  {value}
                </div>
                <span className="text-[11px] text-gray-500 font-medium">{label} hrs</span>
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

        {/* List header */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#1E293B]">OT Requests</span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">{visible.length}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-400">
            <Eye className="w-3.5 h-3.5" />
            View only
          </span>
        </div>

        {visible.map((r) => (
          <OTRequestCard key={r.id} request={r} showStaff />
        ))}

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
