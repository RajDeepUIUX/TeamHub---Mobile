import React, { useCallback, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  CheckCircle2,
  RotateCcw,
  Smartphone,
  Eye,
  Hand,
  Maximize2,
} from 'lucide-react';
import { MobileDeviceFrame, DeviceModel } from './design-system/components/MobileDeviceFrame';
import { AttendanceRecord, AttendanceKPIs as AttendanceKPIsType } from './types/attendance';
import { INITIAL_ATTENDANCE_RECORDS, INITIAL_KPIS } from './data/attendanceData';
import { AttendanceKPIs } from './components/attendance/AttendanceKPIs';
import { AttendanceCard } from './components/attendance/AttendanceCard';
import { PunchLogsSheet } from './components/attendance/PunchLogsSheet';
import { RequestEditSheet } from './components/attendance/RequestEditSheet';
import { FilterSheet, DEFAULT_ATTENDANCE_RANGE } from './components/attendance/FilterSheet';
import { toDateKey } from './design-system/components/RangeCalendar';
import { KPISummarySheet } from './components/attendance/KPISummarySheet';
import { ApplyLeaveView } from './components/attendance/ApplyLeaveView';
import { PublicHolidaysView } from './components/holidays/PublicHolidaysView';
import { WFORecord } from './types/wfo';
import { WFODaysView } from './components/wfo/WFODaysView';
import { WFODetailsView } from './components/wfo/WFODetailsView';
import { AddWFOSheet } from './components/wfo/AddWFOSheet';
import { BottomSheetProvider } from './context/BottomSheetContext';
import { LeavesView } from './components/leaves/LeavesView';
import { ApplyLeaveView as LeavesApplyView } from './components/leaves/ApplyLeaveView';
import { LeaveSubmittedModal } from './components/leaves/LeaveSubmittedModal';
import { LeaveDetailsView } from './components/leaves/LeaveDetailsView';
import { INITIAL_LEAVE_BALANCE, INITIAL_LEAVE_REQUESTS } from './data/leavesData';
import { LeaveRequest, LeaveBalance } from './types/leaves';

export default function App() {
  // Mobile Frame & Canvas State - Pixel 8 active by default
  const [device, setDevice] = useState<DeviceModel>('pixel8');
  const [scale, setScale] = useState<number>(100);
  const [showThumbZones, setShowThumbZones] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [viewMode, setViewMode] = useState<'simulator' | 'deviceOnly'>('simulator');

  // Navigation Sub-tabs: Attendance | Holidays | Leaves | WFO Days (Leaves active by default)
  const [activeModuleTab, setActiveModuleTab] = useState<'Attendance' | 'Holidays' | 'Leaves' | 'WFO Days'>('Leaves');

  // Leaves Module State
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>(INITIAL_LEAVE_BALANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [isApplyingLeaveOpen, setIsApplyingLeaveOpen] = useState(false);
  const [submittedLeave, setSubmittedLeave] = useState<{
    request: LeaveRequest;
    code: string;
    appliedAt: string;
  } | null>(null);

  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);

  // After the success popup, return to the main Leaves listing
  const handleLeaveSubmittedDone = useCallback(() => {
    setSubmittedLeave(null);
    setIsApplyingLeaveOpen(false);
    setActiveModuleTab('Leaves');
  }, []);

  // Month cycle
  const [currentMonth, setCurrentMonth] = useState('September 2026');

  // Attendance Data
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
  const [kpis, setKpis] = useState<AttendanceKPIsType>(INITIAL_KPIS);

  // Active Sheets & Dedicated Views
  const [selectedPunchRecord, setSelectedPunchRecord] = useState<AttendanceRecord | null>(null);
  const [selectedEditRecord, setSelectedEditRecord] = useState<AttendanceRecord | null>(null);
  const [applyingLeaveRecord, setApplyingLeaveRecord] = useState<AttendanceRecord | null>(null);
  const [selectedWFORecord, setSelectedWFORecord] = useState<WFORecord | null>(null);
  const [editingWFORecordFromDetails, setEditingWFORecordFromDetails] = useState<WFORecord | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isKPISummaryOpen, setIsKPISummaryOpen] = useState(false);

  // Filter criteria
  const [activeFilterStatus, setActiveFilterStatus] = useState<string>('All');
  const [activeWorkMode, setActiveWorkMode] = useState<string>('Office');
  const [attendanceRange, setAttendanceRange] = useState(DEFAULT_ATTENDANCE_RANGE);

  // Expand/Collapse state: Default is all collapsed (empty set)
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  const toggleCardExpand = (id: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAnyExpanded = expandedCardIds.size > 0;

  const handleToggleAll = () => {
    if (isAnyExpanded) {
      setExpandedCardIds(new Set());
    } else {
      setExpandedCardIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCancelLeave = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Rejected' as const } : r))
    );
    setSelectedLeave((prev) => (prev?.id === id ? null : prev));
    showToast('Leave request cancelled.');
  };

  // Submit Request Edit
  const handleSubmitEdit = (
    recordId: string,
    officeTime: string,
    workingTime: string,
    reason: string,
    note?: string
  ) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          return {
            ...rec,
            reqOfficeHrs: officeTime,
            reqWorkHrs: workingTime,
            editRequested: true,
            editReason: reason,
            editNote: note,
            editRequestedAt: 'Just now',
          };
        }
        return rec;
      })
    );
    showToast('Attendance edit request submitted successfully.');
  };

  // Submit Apply Leave
  const handleSubmitLeave = (
    recordId: string,
    leaveType: string,
    session: string,
    reason: string
  ) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          return {
            ...rec,
            leaveApplied: true,
            leaveType: `${leaveType} (${session})`,
          };
        }
        return rec;
      })
    );
    showToast(`Leave request for ${leaveType} (${session}) submitted.`);
  };

  // Filter records
  const filteredRecords = records.filter((rec) => {
    if (rec.date < toDateKey(attendanceRange.from) || rec.date > toDateKey(attendanceRange.to)) return false;
    if (activeFilterStatus === 'All') return true;
    if (activeFilterStatus === 'Full Day' && rec.status === 'full_day') return true;
    if (activeFilterStatus === 'Half Day' && rec.status === 'half_day') return true;
    if (activeFilterStatus === 'Absent' && rec.status === 'absent') return true;
    if (activeFilterStatus === 'WO' && rec.status === 'weekly_off') return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      {/* Top Studio Control Bar */}
      <header className="h-13 border-b border-slate-800 bg-slate-950/80 px-5 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#2F68FE] flex items-center justify-center text-white font-bold text-xs shadow-xs">
            TH
          </div>
          <div>
            <span className="font-semibold text-xs tracking-tight text-white">
              Team Hub Mobile
            </span>
            <span className="text-[11px] text-slate-400 ml-2">
              Attendance &amp; Leaves
            </span>
          </div>
        </div>

        {/* Device Controls */}
        <div className="flex items-center gap-2">
          {/* Device Model Selector */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setDevice('iphone16')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                device === 'iphone16'
                  ? 'bg-[#2F68FE] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              iPhone 16 Pro
            </button>
            <button
              onClick={() => setDevice('pixel8')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                device === 'pixel8'
                  ? 'bg-[#2F68FE] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pixel 8
            </button>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              setRecords(INITIAL_ATTENDANCE_RECORDS);
              setActiveFilterStatus('All');
              showToast('Demo data reset to initial screenshot state.');
            }}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs transition-colors"
            title="Reset Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Zoom / Scale */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => setScale(Math.max(75, scale - 10))}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-mono"
            >
              -
            </button>
            <span className="text-xs font-mono text-slate-400 w-9 text-center">
              {scale}%
            </span>
            <button
              onClick={() => setScale(Math.min(100, scale + 10))}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-mono"
            >
              +
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 overflow-auto bg-slate-900 relative">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-6 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="bg-[#1E293B] text-white px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        <div
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease',
          }}
        >
          <BottomSheetProvider>
            <MobileDeviceFrame
              activeDevice={device}
              showThumbZoneOverlay={showThumbZones}
              showTouchHitboxOverlay={showHitboxes}
            >
              {/* Dedicated Apply for Leave View for Leaves Tab (Images 4, 5, 6, 7) */}
              {editingLeave ? (
                <LeavesApplyView
                  key={editingLeave.id}
                  initialRequest={editingLeave}
                  onBack={() => setEditingLeave(null)}
                  availableBalance={leaveBalance.ptoAvailable + editingLeave.daysCount}
                  totalBalance={leaveBalance.ptoTotal}
                  onSubmit={(data) => {
                    const updated: LeaveRequest = {
                      ...editingLeave,
                      dateRange: `${data.startDate} – ${data.endDate}`,
                      daysCount: data.daysCount,
                      reason: data.reason,
                      description: data.description,
                      dayItems: data.dayItems,
                      attachmentName: data.attachmentName,
                    };
                    setLeaveRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                    setLeaveBalance((prev) => ({
                      ...prev,
                      ptoAvailable: Math.max(0, prev.ptoAvailable + editingLeave.daysCount - data.daysCount),
                    }));
                    setEditingLeave(null);
                    setSelectedLeave(updated);
                    showToast('Leave request updated successfully.');
                  }}
                />
              ) : isApplyingLeaveOpen ? (
                <LeavesApplyView
                  onBack={() => setIsApplyingLeaveOpen(false)}
                  availableBalance={leaveBalance.ptoAvailable}
                  totalBalance={leaveBalance.ptoTotal}
                  onSubmit={(data) => {
                    const now = new Date();
                    const appliedDate = now.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const appliedTime = now.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const newReq: LeaveRequest = {
                      id: `leave-${Date.now()}`,
                      type: 'PTO',
                      dateRange: `${data.startDate} – ${data.endDate}`,
                      startDate: '2026-10-20',
                      endDate: '2026-10-23',
                      daysCount: data.daysCount,
                      reason: data.reason,
                      description: data.description,
                      managerName: 'Sarah Miller',
                      managerRole: 'Reporting Manager',
                      appliedOn: appliedDate,
                      status: 'Pending',
                      dayItems: data.dayItems,
                      attachmentName: data.attachmentName,
                    };
                    setLeaveRequests([newReq, ...leaveRequests]);
                    setLeaveBalance((prev) => ({
                      ...prev,
                      ptoAvailable: Math.max(0, prev.ptoAvailable - data.daysCount),
                    }));
                    setSubmittedLeave({
                      request: newReq,
                      code: `LV${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getTime()).slice(-4)}`,
                      appliedAt: `${appliedDate}, ${appliedTime}`,
                    });
                  }}
                />
              ) : selectedLeave ? (
                <LeaveDetailsView
                  request={selectedLeave}
                  onBack={() => setSelectedLeave(null)}
                  onEdit={(req) => setEditingLeave(req)}
                  onCancel={handleCancelLeave}
                />
              ) : applyingLeaveRecord ? (
                <ApplyLeaveView
                  record={applyingLeaveRecord}
                  onBack={() => setApplyingLeaveRecord(null)}
                  onSubmit={handleSubmitLeave}
                />
              ) : selectedWFORecord ? (
                <WFODetailsView
                  record={selectedWFORecord}
                  onBack={() => setSelectedWFORecord(null)}
                  onEdit={(rec) => {
                    setEditingWFORecordFromDetails(rec);
                  }}
                />
              ) : (
                /* Primary Attendance & Leaves Screen matching Screenshots */
                <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
                  {/* 1. Persistent Top Header: Back Arrow + Attendance & Leaves */}
                  <header className="sticky top-0 z-20 bg-white border-b border-[#EBF0F7]">
                    <div className="flex items-center h-13 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeModuleTab !== 'Attendance') {
                            setActiveModuleTab('Attendance');
                          }
                        }}
                        className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] hover:bg-slate-100 transition-colors cursor-pointer"
                        aria-label="Back"
                      >
                        <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                      </button>
                      <h1 className="text-base font-bold text-[#1E293B] ml-2">
                        Attendance &amp; Leaves
                      </h1>
                    </div>

                    {/* 4 Module Sub-Tabs matching Screenshot 1 */}
                    <div className="flex items-center justify-between px-3 border-t border-[#F1F5F9] text-xs font-semibold">
                      {(['Attendance', 'Holidays', 'Leaves', 'WFO Days'] as const).map(
                        (tab) => {
                          const isActive = activeModuleTab === tab;
                          return (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setActiveModuleTab(tab)}
                              className={`flex-1 py-3 text-center transition-all relative cursor-pointer ${
                                isActive
                                  ? 'text-[#2F68FE] font-bold'
                                  : 'text-slate-400 font-medium hover:text-slate-700'
                              }`}
                            >
                              <span>{tab}</span>
                              {isActive && (
                                <div className="absolute bottom-0 left-2 right-2 h-0.75 bg-[#2F68FE] rounded-t-full" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </header>

                  {/* Sub-tab Content: Holidays | Leaves | WFO Days | Attendance */}
                  {activeModuleTab === 'Holidays' ? (
                    <PublicHolidaysView />
                  ) : activeModuleTab === 'Leaves' ? (
                    <LeavesView
                      balance={leaveBalance}
                      requests={leaveRequests}
                      onApplyLeaveClick={() => setIsApplyingLeaveOpen(true)}
                      onCancelRequest={handleCancelLeave}
                      onViewDetails={(req) => setSelectedLeave(req)}
                      onEditRequest={(req) => setEditingLeave(req)}
                    />
                  ) : activeModuleTab === 'WFO Days' ? (
                  <WFODaysView
                    onViewDetails={(rec) => setSelectedWFORecord(rec)}
                  />
                ) : (
                  /* 2. Scrollable Attendance Content */
                  <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-20 space-y-3.5 no-scrollbar">
                  {/* Month Navigation Strip */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentMonth('August 2026');
                        setExpandedCardIds(new Set());
                      }}
                      className="w-8 h-8 rounded-full bg-white border border-[#EBF0F7] shadow-2xs flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <h2 className="text-sm font-bold text-[#1E293B]">
                      {currentMonth}
                    </h2>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentMonth('September 2026');
                        setExpandedCardIds(new Set());
                      }}
                      className="w-8 h-8 rounded-full bg-white border border-[#EBF0F7] shadow-2xs flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                      aria-label="Next month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 3. 3-KPI Card Container (Screenshot 1) */}
                  <AttendanceKPIs
                    kpis={kpis}
                    onOpenSummarySheet={() => setIsKPISummaryOpen(true)}
                  />

                  {/* 4. Date Range & Filter Row (Screenshot 1) */}
                  <div className="flex items-center gap-2.5">
                    {/* Date Range Selector Button */}
                    <button
                      type="button"
                      onClick={() => setIsFilterSheetOpen(true)}
                      className="flex-1 h-12 px-3.5 rounded-2xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 flex items-center justify-between shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>
                          {attendanceRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' - '}
                          {attendanceRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Filter Button */}
                    <button
                      type="button"
                      onClick={() => setIsFilterSheetOpen(true)}
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
                        activeFilterStatus !== 'All'
                          ? 'bg-blue-50 border-[#2F68FE] text-[#2F68FE]'
                          : 'bg-white border-slate-200/90 text-[#2F68FE] hover:bg-slate-50'
                      }`}
                      aria-label="Filter Attendance"
                    >
                      <Filter className="w-4.5 h-4.5 stroke-[1.9]" />
                    </button>
                  </div>

                  {/* 5. Daily Attendance Cards (Collapsible by default) */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1E293B]">
                          Daily Records
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full">
                          {filteredRecords.length}
                        </span>
                      </div>
                      {filteredRecords.length > 0 && (
                        <button
                          type="button"
                          onClick={handleToggleAll}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#2F68FE] bg-[#EFF6FF] hover:bg-[#DBEAFE]/80 active:bg-blue-200 transition-all cursor-pointer shadow-2xs border border-[#BFDBFE]/60"
                        >
                          {isAnyExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Collapse All</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Expand All</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {filteredRecords.map((record) => (
                      <AttendanceCard
                        key={record.id}
                        record={record}
                        isExpanded={expandedCardIds.has(record.id)}
                        onToggleExpand={() => toggleCardExpand(record.id)}
                        onViewPunchLogs={(rec) => setSelectedPunchRecord(rec)}
                        onRequestEdit={(rec) => setSelectedEditRecord(rec)}
                        onApplyLeave={(rec) => setApplyingLeaveRecord(rec)}
                      />
                    ))}

                    {filteredRecords.length === 0 && (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-500">
                        <p className="text-xs font-medium">
                          No attendance records match the selected filters.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFilterStatus('All');
                            setAttendanceRange(DEFAULT_ATTENDANCE_RANGE);
                          }}
                          className="mt-2 text-xs font-semibold text-[#2F68FE] hover:underline"
                        >
                          Clear Filter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            )}

            {/* Bottom Sheet: Punch Logs (Screenshot 4) */}
            <PunchLogsSheet
              isOpen={Boolean(selectedPunchRecord)}
              onClose={() => setSelectedPunchRecord(null)}
              record={selectedPunchRecord}
            />

            {/* Bottom Sheet: Request Attendance Edit (Screenshot 3) */}
            <RequestEditSheet
              isOpen={Boolean(selectedEditRecord)}
              onClose={() => setSelectedEditRecord(null)}
              record={selectedEditRecord}
              onSubmit={handleSubmitEdit}
            />

            {/* Bottom Sheet: Filter Attendance (Screenshot 2) */}
            <FilterSheet
              isOpen={isFilterSheetOpen}
              onClose={() => setIsFilterSheetOpen(false)}
              currentStatus={activeFilterStatus}
              currentFrom={attendanceRange.from}
              currentTo={attendanceRange.to}
              onApply={(status, workMode, from, to) => {
                setActiveFilterStatus(status);
                setActiveWorkMode(workMode);
                setAttendanceRange({ from, to });
                showToast(`Filter applied: ${status}`);
              }}
            />

            {/* Bottom Sheet: Full KPI Summary */}
            <KPISummarySheet
              isOpen={isKPISummaryOpen}
              onClose={() => setIsKPISummaryOpen(false)}
              kpis={kpis}
              monthTitle={currentMonth}
            />

            {/* Bottom Sheet: Edit WFO Days from Details view */}
            <AddWFOSheet
              isOpen={Boolean(editingWFORecordFromDetails)}
              onClose={() => setEditingWFORecordFromDetails(null)}
              recordToEdit={editingWFORecordFromDetails}
              onSubmit={(month, year, days) => {
                if (selectedWFORecord) {
                  setSelectedWFORecord({
                    ...selectedWFORecord,
                    month,
                    year,
                    days,
                    monthYear: `${month} ${year}`,
                    status: 'Pending',
                  });
                }
                showToast('WFO request updated successfully.');
              }}
            />

            {/* Leave Submitted Success Popup (auto-returns to Leaves listing) */}
            <LeaveSubmittedModal
              request={submittedLeave?.request ?? null}
              requestCode={submittedLeave?.code ?? ''}
              appliedAt={submittedLeave?.appliedAt ?? ''}
              onDone={handleLeaveSubmittedDone}
            />
          </MobileDeviceFrame>
        </BottomSheetProvider>
      </div>
      </main>
    </div>
  );
}
