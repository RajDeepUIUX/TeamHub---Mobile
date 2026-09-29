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
  LogOut,
  Smartphone,
  Eye,
  Hand,
  Maximize2,
} from 'lucide-react';
import { MobileDeviceFrame, DeviceModel } from './design-system/components/MobileDeviceFrame';
import { AttendanceRecord, AttendanceKPIs as AttendanceKPIsType } from './types/attendance';
import { ATTENDANCE_MONTHS, ALL_ATTENDANCE_RECORDS } from './data/attendanceMonths';
import { AttendanceKPIs } from './components/attendance/AttendanceKPIs';
import { AttendanceCard } from './components/attendance/AttendanceCard';
import { PunchLogsSheet } from './components/attendance/PunchLogsSheet';
import { RequestEditSheet } from './components/attendance/RequestEditSheet';
import { FilterSheet } from './components/attendance/FilterSheet';
import { toDateKey } from './design-system/components/RangeCalendar';
import { KPISummarySheet } from './components/attendance/KPISummarySheet';
import { ApplyLeaveView } from './components/attendance/ApplyLeaveView';
import { PublicHolidaysView } from './components/holidays/PublicHolidaysView';
import { WFORecord } from './types/wfo';
import { WFODaysView } from './components/wfo/WFODaysView';
import { WFODetailsView } from './components/wfo/WFODetailsView';
import { AddWFOSheet } from './components/wfo/AddWFOSheet';
import { INITIAL_WFO_RECORDS } from './data/wfoData';
import { BottomSheetProvider } from './context/BottomSheetContext';
import { LeavesView } from './components/leaves/LeavesView';
import { ApplyLeaveView as LeavesApplyView } from './components/leaves/ApplyLeaveView';
import { LeaveSubmittedModal } from './components/leaves/LeaveSubmittedModal';
import { LeaveDetailsView } from './components/leaves/LeaveDetailsView';
import { INITIAL_LEAVE_BALANCE, INITIAL_LEAVE_REQUESTS, TEAM_LEAVE_REQUESTS_SEED } from './data/leavesData';
import { TeamLeavesView } from './components/leaves/TeamLeavesView';
import type { LeaveDecision } from './components/leaves/LeaveReviewSheet';
import { LeaveRequest, LeaveBalance } from './types/leaves';
import { UserRole, USER_ROLES } from './types/user';
import { HomeDashboard } from './components/home/HomeDashboard';
import { CelebrationsView, CelebrationTab } from './components/home/CelebrationsView';
import { ComingSoonView } from './components/home/ComingSoonView';
import { AppBottomNav, AppTab } from './components/home/AppBottomNav';
import { WishSheet } from './components/home/WishSheet';
import { BIRTHDAYS, ANNIVERSARIES, TeamCelebration } from './data/dashboardData';
import { HOLIDAYS_DATA } from './data/holidayData';
import { AuthFlow } from './components/auth/AuthFlow';
import { ProfileView } from './components/profile/ProfileView';
import { ResignationView } from './components/resignation/ResignationView';
import { ApplyResignationView } from './components/resignation/ApplyResignationView';
import { ResignationRecord, ReviewDecision } from './types/resignation';
import { REPORTING_MANAGER, CURRENT_STAFF, TEAM_RESIGNATIONS_SEED, toISODate } from './data/resignationData';
import type { ResignationFormData } from './components/resignation/ApplyResignationView';
import { TicketsView } from './components/tickets/TicketsView';
import { CreateTicketView } from './components/tickets/CreateTicketView';
import { Ticket } from './types/tickets';
import { STAFF_TICKETS_SEED, TEAM_TICKETS_SEED } from './data/ticketsData';
import type { NewTicketData } from './components/tickets/CreateTicketView';
import { TeamAttendanceView } from './components/attendance/TeamAttendanceView';
import { SegmentedTabs } from './design-system/components/SegmentedTabs';
import type { AttendanceDecision } from './components/attendance/AttendanceReviewSheet';
import { TEAM_ATTENDANCE_REQUESTS_SEED, ATTENDANCE_REVIEWER, ATTENDANCE_STAFF_CODE } from './data/teamAttendanceData';

export default function App() {
  // Mobile Frame & Canvas State - Pixel 8 active by default
  const [device, setDevice] = useState<DeviceModel>('pixel8');

  // Logged-in user role (Staff by default); Manager review screens come later
  const [userRole, setUserRole] = useState<UserRole>('Staff');

  // Auth: splash -> login (or forgot-password flow) -> app
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Main app navigation (bottom nav). Home dashboard is the first screen after login.
  const [appTab, setAppTab] = useState<AppTab>('home');
  const [celebrationsTab, setCelebrationsTab] = useState<CelebrationTab | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // Module opened from the profile menu (e.g. 'Resignation'); null shows the profile itself
  const [profileModule, setProfileModule] = useState<string | null>(null);
  // Resignation module: no logs initially; newest first
  const [resignations, setResignations] = useState<ResignationRecord[]>([]);
  // Other team members' resignations (seen by the reporting manager)
  const [teamResignations, setTeamResignations] = useState<ResignationRecord[]>(TEAM_RESIGNATIONS_SEED);
  // The manager's own resignations ("My Resignation" tab in Manager role)
  const [managerResignations, setManagerResignations] = useState<ResignationRecord[]>([]);
  const [isApplyingResignation, setIsApplyingResignation] = useState(false);
  // Tickets module: staff member's tickets, the rest of the team's, and the manager's own
  const [staffTickets, setStaffTickets] = useState<Ticket[]>(STAFF_TICKETS_SEED);
  const [teamTickets, setTeamTickets] = useState<Ticket[]>(TEAM_TICKETS_SEED);
  const [managerTickets, setManagerTickets] = useState<Ticket[]>([]);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const isManager = userRole === 'Manager';
  // Identity used for the resignation module: staff = Shanker, manager = his reporting manager
  const resignationUser = isManager
    ? { staffName: REPORTING_MANAGER, staffCode: 'A01120', designation: 'Design Manager', department: 'Product Design' }
    : CURRENT_STAFF;
  const myResignations = isManager ? managerResignations : resignations;
  const setMyResignations = isManager ? setManagerResignations : setResignations;

  const submitResignation = (data: ResignationFormData) => {
    setMyResignations((prev) => [
      {
        id: `resig-${Date.now()}`,
        ...resignationUser,
        ...data,
        status: 'Notice',
        // A manager's own resignation goes to their manager
        reportingManager: isManager ? 'Priya Nair' : REPORTING_MANAGER,
        managerApproval: 'Pending',
        ctmApproval: 'Pending',
      },
      ...prev,
    ]);
    setIsApplyingResignation(false);
    showToast('Resignation submitted to your reporting manager.');
  };

  // Manager decision → updates the shared record, so the staff side reflects it instantly
  const reviewResignation = (id: string, decision: ReviewDecision, comment: string) => {
    const apply = (list: ResignationRecord[]) =>
      list.map((r) =>
        r.id === id
          ? {
              ...r,
              managerApproval: decision,
              managerComment: comment || undefined,
              managerReviewedAt: toISODate(new Date()),
              status: decision === 'Rejected' ? ('Rejected' as const) : r.status,
            }
          : r
      );
    setResignations(apply);
    setTeamResignations(apply);
    showToast(`Resignation ${decision === 'Approved' ? 'approved' : 'rejected'}.`);
  };

  const byNewest = (list: Ticket[]) => [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const myTickets = byNewest(isManager ? managerTickets : staffTickets);
  const teamTicketList = byNewest([...staffTickets, ...teamTickets]);

  // Applies a change to whichever list holds the ticket, so staff and manager views stay in sync
  const updateTicket = (id: string, change: (t: Ticket) => Ticket) => {
    const apply = (list: Ticket[]) => list.map((t) => (t.id === id ? change(t) : t));
    setStaffTickets(apply);
    setTeamTickets(apply);
    setManagerTickets(apply);
  };

  const createTicket = (data: NewTicketData) => {
    const all = [...staffTickets, ...teamTickets, ...managerTickets];
    const nextId = String(Math.max(93400, ...all.map((t) => Number(t.id) || 0)) + 1);
    const ticket: Ticket = {
      id: nextId,
      staffName: resignationUser.staffName,
      staffCode: resignationUser.staffCode,
      ...data,
      status: 'Open',
      createdAt: new Date().toISOString(),
      comments: [],
    };
    (isManager ? setManagerTickets : setStaffTickets)((prev) => [ticket, ...prev]);
    setIsCreatingTicket(false);
    showToast(`Ticket #${nextId} created. The team will get back to you soon.`);
  };

  const commentOnTicket = (id: string, text: string) =>
    updateTicket(id, (t) => ({
      ...t,
      comments: [
        ...t.comments,
        {
          id: `c-${Date.now()}`,
          author: resignationUser.staffName,
          role: isManager ? 'Manager' : 'Staff',
          text,
          createdAt: new Date().toISOString(),
        },
      ],
    }));

  const reopenTicket = (id: string, reason: string) => {
    updateTicket(id, (t) => ({
      ...t,
      status: 'Open',
      comments: [
        ...t.comments,
        {
          id: `c-${Date.now()}`,
          author: 'System',
          role: 'System',
          text: `Reopened by ${resignationUser.staffName}: “${reason}”`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    showToast(`Ticket #${id} reopened.`);
  };

  // Manager decision on an attendance edit request → reflected on the staff member's card
  const reviewAttendanceMany = (ids: string[], decision: AttendanceDecision, comment: string) => {
    const reviewedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const idSet = new Set(ids);
    const apply = (list: AttendanceRecord[]) =>
      list.map((r) =>
        idSet.has(r.id)
          ? {
              ...r,
              editStatus: decision,
              editReviewedBy: ATTENDANCE_REVIEWER,
              editReviewedAt: reviewedAt,
              managerRemark: comment || undefined,
              ...(decision === 'approved'
                ? { status: 'full_day' as const, statusLabel: 'Full Day (Approved)' }
                : { statusLabel: 'Rejected' }),
            }
          : r
      );
    setRecords(apply);
    setTeamAttendanceRequests(apply);
    const verb = decision === 'approved' ? 'approved' : 'rejected';
    showToast(ids.length === 1 ? `Edit request ${verb}.` : `${ids.length} edit requests ${verb}.`);
  };
  const reviewAttendance = (id: string, decision: AttendanceDecision, comment: string) =>
    reviewAttendanceMany([id], decision, comment);
  // Profile photo (data URL); null shows first + last name initials
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [wishTarget, setWishTarget] = useState<{ person: TeamCelebration; kind: 'birthday' | 'anniversary' } | null>(null);

  const todayKey = toDateKey(new Date());
  const upcomingHolidays = HOLIDAYS_DATA.filter((h) => h.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date));
  const holidaysNext30Days = upcomingHolidays.filter(
    (h) => new Date(`${h.date}T00:00:00`).getTime() - Date.now() <= 30 * 86400000
  ).length;

  const handleAppTabChange = (tab: AppTab) => {
    setCelebrationsTab(null);
    setIsProfileOpen(false);
    setProfileModule(null);
    if (tab === 'attendance') setActiveModuleTab('Attendance');
    setAppTab(tab);
  };
  const [scale, setScale] = useState<number>(100);
  const [showThumbZones, setShowThumbZones] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [viewMode, setViewMode] = useState<'simulator' | 'deviceOnly'>('simulator');

  // Navigation Sub-tabs: Attendance | Holidays | Leaves | WFO Days (Leaves active by default)
  const [activeModuleTab, setActiveModuleTab] = useState<'Attendance' | 'Holidays' | 'Leaves' | 'WFO Days'>('Leaves');

  // Leaves Module State
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>(INITIAL_LEAVE_BALANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  // Manager's own leaves ("My Leaves") and the rest of the team's requests ("Team's Leaves")
  const [managerLeaveBalance, setManagerLeaveBalance] = useState<LeaveBalance>(INITIAL_LEAVE_BALANCE);
  const [managerLeaveRequests, setManagerLeaveRequests] = useState<LeaveRequest[]>([]);
  const [teamLeaveRequests, setTeamLeaveRequests] = useState<LeaveRequest[]>(TEAM_LEAVE_REQUESTS_SEED);
  const [leavesTab, setLeavesTab] = useState<'mine' | 'team'>('team');
  const myLeaveRequests = isManager ? managerLeaveRequests : leaveRequests;
  const setMyLeaveRequests = isManager ? setManagerLeaveRequests : setLeaveRequests;
  const myLeaveBalance = isManager ? managerLeaveBalance : leaveBalance;
  const setMyLeaveBalance = isManager ? setManagerLeaveBalance : setLeaveBalance;
  // Staff member's requests + the rest of the team's: pending first, then most recent
  const teamLeaveList = [...leaveRequests, ...teamLeaveRequests].sort((a, b) =>
    a.status === 'Pending' && b.status !== 'Pending'
      ? -1
      : b.status === 'Pending' && a.status !== 'Pending'
        ? 1
        : b.startDate.localeCompare(a.startDate)
  );
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
  // Attendance month cycle (26th of previous month → 25th); latest cycle selected by default
  const [monthIndex, setMonthIndex] = useState(ATTENDANCE_MONTHS.length - 1);
  const currentMonth = ATTENDANCE_MONTHS[monthIndex];

  // Attendance Data
  const [records, setRecords] = useState<AttendanceRecord[]>(ALL_ATTENDANCE_RECORDS);
  // Manager's "Team's Attendance": other team members' edit requests (the staff member's own come from `records`)
  const [teamAttendanceRequests, setTeamAttendanceRequests] = useState<AttendanceRecord[]>(TEAM_ATTENDANCE_REQUESTS_SEED);
  const [attendanceTab, setAttendanceTab] = useState<'mine' | 'team'>('team');

  // Staff member's own edit requests + the rest of the team's, newest first
  const teamAttendanceList = [
    ...records.filter((r) => r.editRequested).map((r) => ({ ...r, staffCode: r.staffCode ?? ATTENDANCE_STAFF_CODE })),
    ...teamAttendanceRequests,
  ].sort((a, b) => b.date.localeCompare(a.date));
  const kpis: AttendanceKPIsType = currentMonth.kpis;

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
  const [attendanceRange, setAttendanceRange] = useState(currentMonth.range);

  const changeMonth = (index: number) => {
    const month = ATTENDANCE_MONTHS[index];
    if (!month) return;
    setMonthIndex(index);
    setAttendanceRange(month.range);
    setActiveFilterStatus('All');
    setExpandedCardIds(new Set());
  };

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
    setMyLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Rejected' as const } : r))
    );
    setSelectedLeave((prev) => (prev?.id === id ? null : prev));
    showToast('Leave request cancelled.');
  };

  const reviewLeaves = (ids: string[], decision: LeaveDecision, comment: string) => {
    const reviewedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const idSet = new Set(ids);
    const apply = (list: LeaveRequest[]) =>
      list.map((r) =>
        idSet.has(r.id) ? { ...r, status: decision, managerComment: comment || undefined, reviewedAt } : r
      );
    // Rejected PTO goes back to the staff member's balance
    const refunded = leaveRequests
      .filter((r) => idSet.has(r.id) && decision === 'Rejected' && r.type === 'PTO')
      .reduce((n, r) => n + r.daysCount, 0);
    if (refunded) setLeaveBalance((b) => ({ ...b, ptoAvailable: Math.min(b.ptoTotal, b.ptoAvailable + refunded) }));
    setLeaveRequests(apply);
    setTeamLeaveRequests(apply);
    const verb = decision === 'Approved' ? 'approved' : 'rejected';
    showToast(ids.length === 1 ? `Leave request ${verb}.` : `${ids.length} leave requests ${verb}.`);
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
            editStatus: 'pending' as const,
            editReason: reason,
            editNote: note,
            editRequestedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            staffCode: ATTENDANCE_STAFF_CODE,
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
  const filteredRecords = records
    .filter((rec) => {
      if (rec.date < toDateKey(attendanceRange.from) || rec.date > toDateKey(attendanceRange.to)) return false;
      if (activeFilterStatus === 'All') return true;
      if (activeFilterStatus === 'Full Day' && rec.status === 'full_day') return true;
      if (activeFilterStatus === 'Half Day' && rec.status === 'half_day') return true;
      if (activeFilterStatus === 'Absent' && rec.status === 'absent') return true;
      if (activeFilterStatus === 'WO' && rec.status === 'weekly_off') return true;
      return false;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

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
          {/* User Role Selector */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            {USER_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => {
                  if (role === userRole) return;
                  setUserRole(role);
                  showToast(`Logged in as ${role}`);
                }}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  userRole === role
                    ? 'bg-[#2F68FE] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

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

          {/* Log out: replays splash + login flow */}
          {isLoggedIn && (
            <button
              onClick={() => {
                setIsProfileOpen(false);
                setIsLoggedIn(false);
              }}
              className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 text-xs font-medium transition-colors"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          )}

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              setRecords(ALL_ATTENDANCE_RECORDS);
              changeMonth(ATTENDANCE_MONTHS.length - 1);
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
              {!isLoggedIn ? (
                <AuthFlow
                  onAuthenticated={() => {
                    setIsLoggedIn(true);
                    setAppTab('home');
                    setCelebrationsTab(null);
                    showToast(`Signed in as ${userRole}`);
                  }}
                />
              ) : isProfileOpen && profileModule === 'Tickets' && isCreatingTicket ? (
                <CreateTicketView onBack={() => setIsCreatingTicket(false)} onSubmit={createTicket} />
              ) : isProfileOpen && profileModule === 'Tickets' ? (
                <TicketsView
                  key={userRole}
                  firstName={resignationUser.staffName.split(' ')[0]}
                  currentUser={resignationUser.staffName}
                  tickets={myTickets}
                  teamTickets={isManager ? teamTicketList : undefined}
                  onBack={() => setProfileModule(null)}
                  onCreate={() => setIsCreatingTicket(true)}
                  onComment={commentOnTicket}
                  onReopen={reopenTicket}
                />
              ) : isProfileOpen && profileModule === 'Resignation' && isApplyingResignation ? (
                <ApplyResignationView
                  employeeName={resignationUser.staffName}
                  onBack={() => setIsApplyingResignation(false)}
                  onSubmit={submitResignation}
                />
              ) : isProfileOpen && profileModule === 'Resignation' ? (
                <ResignationView
                  key={userRole}
                  firstName={resignationUser.staffName.split(' ')[0]}
                  records={myResignations}
                  onBack={() => setProfileModule(null)}
                  onApply={() => setIsApplyingResignation(true)}
                  team={
                    isManager
                      ? {
                          // Staff member's own submissions + the rest of the team, newest first
                          records: [...resignations, ...teamResignations].sort((a, b) =>
                            b.resignationDate.localeCompare(a.resignationDate)
                          ),
                          onReview: reviewResignation,
                        }
                      : undefined
                  }
                  onWithdraw={(id, reason) => {
                    setMyResignations((prev) =>
                      prev.map((r) =>
                        r.id === id
                          ? { ...r, status: 'Withdrawn', withdrawReason: reason, withdrawnAt: toISODate(new Date()) }
                          : r
                      )
                    );
                    showToast('Resignation withdrawn.');
                  }}
                />
              ) : isProfileOpen ? (
                <ProfileView
                  name="Shanker Dey"
                  email="shanker.dey@my-cpe.com"
                  role="Lead Designer"
                  branch="Ahmedabad - Gota Branch"
                  employeeId="A03780"
                  onBack={() => setIsProfileOpen(false)}
                  onLogout={() => {
                    setIsProfileOpen(false);
                    setProfileModule(null);
                    setIsLoggedIn(false);
                  }}
                  onOpenItem={(label) => {
                    if (label === 'Resignation' || label === 'Tickets') {
                      setIsApplyingResignation(false);
                      setIsCreatingTicket(false);
                      setProfileModule(label);
                    } else {
                      showToast(`${label} is coming soon.`);
                    }
                  }}
                  onPasswordChanged={() => showToast('Password updated successfully.')}
                  photoUrl={profilePhoto}
                  onPhotoChange={(url) => {
                    setProfilePhoto(url);
                    showToast(url ? 'Profile photo updated.' : 'Profile photo removed.');
                  }}
                />
              ) : celebrationsTab ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <CelebrationsView
                    key={celebrationsTab}
                    initialTab={celebrationsTab}
                    birthdays={BIRTHDAYS}
                    anniversaries={ANNIVERSARIES}
                    upcomingHolidays={upcomingHolidays}
                    holidaysNext30Days={holidaysNext30Days}
                    onBack={() => setCelebrationsTab(null)}
                    onWish={(person, kind) => setWishTarget({ person, kind })}
                  />
                  <AppBottomNav activeTab="home" onTabChange={handleAppTabChange} />
                </div>
              ) : appTab === 'home' ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <HomeDashboard
                    userName="Shanker"
                    todaysBirthdays={BIRTHDAYS.filter((b) => b.inDays === 0)}
                    upcomingHolidayCount={holidaysNext30Days}
                    onOpenAttendance={() => handleAppTabChange('attendance')}
                    onOpenCelebrations={(tab) => setCelebrationsTab(tab)}
                    onViewLog={() => setSelectedPunchRecord(records[0] ?? null)}
                    onWish={(person) => setWishTarget({ person, kind: 'birthday' })}
                    onComingSoon={(feature) => showToast(`${feature} is coming soon.`)}
                    onOpenProfile={() => {
                      setProfileModule(null);
                      setIsProfileOpen(true);
                    }}
                    fullName="Shanker Dey"
                    profilePhoto={profilePhoto}
                  />
                  <AppBottomNav activeTab="home" onTabChange={handleAppTabChange} />
                </div>
              ) : appTab !== 'attendance' ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <ComingSoonView
                    title={appTab === 'learning' ? 'Learning' : appTab === 'requests' ? 'Requests' : 'More'}
                    onGoHome={() => handleAppTabChange('home')}
                  />
                  <AppBottomNav activeTab={appTab} onTabChange={handleAppTabChange} />
                </div>
              ) : editingLeave ? (
                <LeavesApplyView
                  key={editingLeave.id}
                  initialRequest={editingLeave}
                  onBack={() => setEditingLeave(null)}
                  availableBalance={myLeaveBalance.ptoAvailable + editingLeave.daysCount}
                  totalBalance={myLeaveBalance.ptoTotal}
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
                    setMyLeaveRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                    setMyLeaveBalance((prev) => ({
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
                  availableBalance={myLeaveBalance.ptoAvailable}
                  totalBalance={myLeaveBalance.ptoTotal}
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
                      staffName: resignationUser.staffName,
                      staffCode: resignationUser.staffCode,
                      type: 'PTO',
                      dateRange: `${data.startDate} – ${data.endDate}`,
                      startDate: '2026-10-20',
                      endDate: '2026-10-23',
                      daysCount: data.daysCount,
                      reason: data.reason,
                      description: data.description,
                      managerName: isManager ? 'Priya Nair' : ATTENDANCE_REVIEWER,
                      managerRole: 'Reporting Manager',
                      appliedOn: appliedDate,
                      status: 'Pending',
                      dayItems: data.dayItems,
                      attachmentName: data.attachmentName,
                    };
                    setMyLeaveRequests((prev) => [newReq, ...prev]);
                    setMyLeaveBalance((prev) => ({
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
                        onClick={() => handleAppTabChange('home')}
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
                    <div className="flex-1 min-h-0 flex flex-col">
                      {isManager && (
                        <div className="shrink-0 px-4 pt-3 pb-1 bg-[#F8FAFC]">
                          <SegmentedTabs
                            ariaLabel="Leaves view"
                            value={leavesTab}
                            onChange={setLeavesTab}
                            options={[
                              { id: 'mine', label: 'My Leaves' },
                              {
                                id: 'team',
                                label: "Team's Leaves",
                                badge: teamLeaveList.filter((r) => r.status === 'Pending').length,
                              },
                            ]}
                          />
                        </div>
                      )}
                      {isManager && leavesTab === 'team' ? (
                        <TeamLeavesView requests={teamLeaveList} onReview={reviewLeaves} />
                      ) : (
                        <LeavesView
                          balance={myLeaveBalance}
                          requests={myLeaveRequests}
                          onApplyLeaveClick={() => setIsApplyingLeaveOpen(true)}
                          onCancelRequest={handleCancelLeave}
                          onViewDetails={(req) => setSelectedLeave(req)}
                          onEditRequest={(req) => setEditingLeave(req)}
                        />
                      )}
                    </div>
                  ) : activeModuleTab === 'WFO Days' ? (
                  <WFODaysView
                    onViewDetails={(rec) => setSelectedWFORecord(rec)}
                  />
                ) : (
                  <div className="flex-1 min-h-0 flex flex-col">
                  {/* Manager: My Attendance / Team's Attendance (segmented, so it reads as a view switch) */}
                  {isManager && (
                    <div className="shrink-0 px-4 pt-3 pb-1 bg-[#F8FAFC]">
                      <SegmentedTabs
                        ariaLabel="Attendance view"
                        value={attendanceTab}
                        onChange={setAttendanceTab}
                        options={[
                          { id: 'mine', label: 'My Attendance' },
                          {
                            id: 'team',
                            label: "Team's Attendance",
                            badge: teamAttendanceList.filter(
                              (r) => r.editStatus !== 'approved' && r.editStatus !== 'rejected'
                            ).length,
                          },
                        ]}
                      />
                    </div>
                  )}
                  {isManager && attendanceTab === 'team' ? (
                    <TeamAttendanceView
                      requests={teamAttendanceList}
                      onReview={reviewAttendance}
                      onBulkReview={reviewAttendanceMany}
                      onViewLogs={(rec) => setSelectedPunchRecord(rec)}
                    />
                  ) : (
                  /* 2. Scrollable Attendance Content */
                  <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-20 space-y-3.5 no-scrollbar">
                  {/* Month Navigation Strip */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => changeMonth(monthIndex - 1)}
                      disabled={monthIndex === 0}
                      className="w-8 h-8 rounded-full bg-white border border-[#EBF0F7] shadow-2xs flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <h2 className="text-sm font-bold text-[#1E293B]">
                      {currentMonth.label}
                    </h2>

                    <button
                      type="button"
                      onClick={() => changeMonth(monthIndex + 1)}
                      disabled={monthIndex === ATTENDANCE_MONTHS.length - 1}
                      className="w-8 h-8 rounded-full bg-white border border-[#EBF0F7] shadow-2xs flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                            setAttendanceRange(currentMonth.range);
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
              defaultRange={currentMonth.range}
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
              monthTitle={currentMonth.label}
            />

            {/* Bottom Sheet: Edit WFO Days from Details view */}
            <AddWFOSheet
              isOpen={Boolean(editingWFORecordFromDetails)}
              onClose={() => setEditingWFORecordFromDetails(null)}
              recordToEdit={editingWFORecordFromDetails}
              existingRecords={INITIAL_WFO_RECORDS}
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

            {/* Send birthday / anniversary wishes */}
            <WishSheet
              person={wishTarget?.person ?? null}
              kind={wishTarget?.kind ?? 'birthday'}
              onClose={() => setWishTarget(null)}
              onSend={(person) => {
                setWishTarget(null);
                showToast(`Wish sent to ${person.name} 🎉`);
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
