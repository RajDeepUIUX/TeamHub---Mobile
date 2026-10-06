import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
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
import { ScreenTransition } from './design-system/components/ScreenTransition';
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
import { INITIAL_WFO_RECORDS, TEAM_WFO_RECORDS_SEED, WFO_MANAGER, WFO_TEAM, formatINR as formatWFOINR, wfoAllowanceFor } from './data/wfoData';
import { TeamWFOView, WFODecision } from './components/wfo/TeamWFOView';
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
import { AppHeader } from './components/home/AppHeader';
import { MyProfileView } from './components/profile/MyProfileView';
import { StaffReviewView } from './components/profile/StaffReviewView';
import { AnnualReviewView } from './components/profile/AnnualReviewView';
import { AdvanceSalaryView } from './components/support/AdvanceSalaryView';
import { AdvanceDraft, AdvanceRequestView } from './components/support/AdvanceRequestView';
import { AdvanceGuidelineSheet } from './components/support/AdvanceGuidelineSheet';
import { CabDecision, CabRequestView } from './components/support/CabRequestView';
import { CabRequestFormView } from './components/support/CabRequestFormView';
import { CAB_MANAGER, CAB_REQUESTS_SEED, CAB_TEAM, CabDraft, CabRequest, cabTitle } from './data/cabRequestData';
import {
  ADVANCE_MANAGER,
  ADVANCE_REQUESTS_SEED,
  ADVANCE_TEAM,
  AdvanceRequest,
  AdvanceRequestType,
  TEAM_ADVANCE_REQUESTS_SEED,
  formatINR as formatAdvanceINR,
  isEvLoan,
} from './data/advanceSalaryData';
import type { AdvanceDecision } from './components/support/TeamAdvanceList';
import { REVIEW_CYCLES_SEED, ReviewCycle } from './data/annualReviewData';
import { MY_PROFILE_SEED, MyProfileData } from './data/profileData';
import { WishSheet } from './components/home/WishSheet';
import { BIRTHDAYS, ANNIVERSARIES, TeamCelebration } from './data/dashboardData';
import { HOLIDAYS_DATA } from './data/holidayData';
import { AuthFlow } from './components/auth/AuthFlow';
import { ProfileView } from './components/profile/ProfileView';
import { NotificationsView } from './components/notifications/NotificationsView';
import {
  AppNotification,
  STAFF_NOTIFICATIONS_SEED,
  MANAGER_NOTIFICATIONS_SEED,
} from './data/notificationsData';
import { MoreView } from './components/more/MoreView';
import { WorkTimingView } from './components/more/WorkTimingView';
import { OTRequestView } from './components/more/OTRequestView';
import { AddOTRequestView } from './components/more/AddOTRequestView';
import { OTRequest } from './types/overtime';
import { TEAM_OT_REQUESTS_SEED } from './data/overtimeData';
import { RequestFlexibilityView } from './components/more/RequestFlexibilityView';
import { FlexRequest } from './types/workTiming';
import { TEAM_FLEX_REQUESTS_SEED } from './data/workTimingData';
import { Declarant } from './data/staffDeclaration';
import { CompanyFeedView, FeedPostView } from './components/feed/CompanyFeedView';
import { FEED_POSTS_SEED, FeedCategory, FeedPost, FeedReaction } from './data/companyFeedData';
import { MyTeamView } from './components/more/MyTeamView';
import { MY_TEAM_SEED, TeamMemberRecord, profileForMember } from './data/myTeamData';
import type { FlexDecision } from './components/more/FlexReviewSheet';
import { ResignationView } from './components/resignation/ResignationView';
import { ApplyResignationView } from './components/resignation/ApplyResignationView';
import { ResignationRecord, ReviewDecision } from './types/resignation';
import { REPORTING_MANAGER, CURRENT_STAFF, TEAM_RESIGNATIONS_SEED, toISODate } from './data/resignationData';
import type { ResignationFormData } from './components/resignation/ApplyResignationView';
import { TicketsView } from './components/tickets/TicketsView';
import { RelevantContactsView } from './components/more/RelevantContactsView';
import { VoipDirectoryView } from './components/more/VoipDirectoryView';
import { AssetsView } from './components/assets/AssetsView';
import { ASSETS_SEED, TEAM_ASSET_MEMBERS } from './data/assetsData';
import type { AssetRecord } from './types/assets';
import { CreateTicketView } from './components/tickets/CreateTicketView';
import { Ticket } from './types/tickets';
import { STAFF_TICKETS_SEED, TEAM_TICKETS_SEED } from './data/ticketsData';
import type { NewTicketData } from './components/tickets/CreateTicketView';
import { TeamAttendanceView } from './components/attendance/TeamAttendanceView';
import { SegmentedTabs } from './design-system/components/SegmentedTabs';
import type { AttendanceDecision } from './components/attendance/AttendanceReviewSheet';
import {
  TEAM_ATTENDANCE_REQUESTS_SEED,
  TEAM_DAILY_ATTENDANCE_SEED,
  TEAM_CYCLE,
  generateMemberDays,
  ATTENDANCE_REVIEWER,
  ATTENDANCE_STAFF_CODE,
} from './data/teamAttendanceData';

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

  // Notifications per role; events (approvals, new requests, IT review) add to the right inbox
  const [staffNotifications, setStaffNotifications] = useState<AppNotification[]>(STAFF_NOTIFICATIONS_SEED);
  const [managerNotifications, setManagerNotifications] = useState<AppNotification[]>(MANAGER_NOTIFICATIONS_SEED);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const pushNotification = (to: 'Staff' | 'Manager', n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const item: AppNotification = {
      ...n,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    (to === 'Staff' ? setStaffNotifications : setManagerNotifications)((prev) => [item, ...prev]);
  };
  // Module opened from the More tab (e.g. 'work-timing'); null shows the module list
  const [moreModule, setMoreModule] = useState<string | null>(null);
  // Attendance & Leaves opened from the More list: Back returns there instead of Home
  const [attendanceFromMore, setAttendanceFromMore] = useState(false);
  // Company Feed: shared by every role; read state + the user's reactions live for the session
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(FEED_POSTS_SEED);
  const [feedReactions, setFeedReactions] = useState<Record<string, FeedReaction>>({});
  const [feedCategory, setFeedCategory] = useState<FeedCategory>('General');
  const [openFeedPostId, setOpenFeedPostId] = useState<string | null>(null);
  const openFeedPost = feedPosts.find((p) => p.id === openFeedPostId) ?? null;
  // My Team (Manager only): the manager's whole hierarchy
  const [myTeam] = useState<TeamMemberRecord[]>(MY_TEAM_SEED);
  // OT requests (staff & manager keep their own lists): one per person, auto-approved, changes only via a ticket
  const [staffOTRequests, setStaffOTRequests] = useState<OTRequest[]>([]);
  const [managerOTRequests, setManagerOTRequests] = useState<OTRequest[]>([]);
  // Manager: the rest of the team's OT requests (the staff member's own come from staffOTRequests)
  const [teamOTRequests, setTeamOTRequests] = useState<OTRequest[]>(TEAM_OT_REQUESTS_SEED);
  const [isAddingOT, setIsAddingOT] = useState(false);
  // Work Timing: flexibility requests (empty initially) and the request flow
  const [flexRequests, setFlexRequests] = useState<FlexRequest[]>([]);
  // Manager: the rest of the team's requests, and their own ("My Work Timing")
  const [teamFlexRequests, setTeamFlexRequests] = useState<FlexRequest[]>(TEAM_FLEX_REQUESTS_SEED);
  const [managerFlexRequests, setManagerFlexRequests] = useState<FlexRequest[]>([]);
  const [isRequestingFlex, setIsRequestingFlex] = useState(false);
  // Pending request being edited (null = creating a new one)
  const [editingFlex, setEditingFlex] = useState<FlexRequest | null>(null);
  // Module opened from the profile menu (e.g. 'Resignation'); null shows the profile itself
  const [profileModule, setProfileModule] = useState<string | null>(null);
  // Profile modules can also be opened from Home (Staff Review) or More (Support);
  // when true, Back from the module returns there instead of the Profile menu
  const [profileModuleFromApp, setProfileModuleFromApp] = useState(false);
  const closeProfileModule = () => {
    setProfileModule(null);
    if (profileModuleFromApp) setIsProfileOpen(false);
  };
  // Staff Review › Start Evaluation (Team Member Annual Review)
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [reviewCycles, setReviewCycles] = useState<ReviewCycle[]>(REVIEW_CYCLES_SEED);
  // Support › Adv. Salary & EV Loan: one shared list so manager decisions reflect on the staff side
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([...ADVANCE_REQUESTS_SEED, ...TEAM_ADVANCE_REQUESTS_SEED]);
  /** 'new' = raising a request, an id = editing it, null = list */
  const [advanceFormFor, setAdvanceFormFor] = useState<string | null>(null);
  const [advanceSubmittedType, setAdvanceSubmittedType] = useState<AdvanceRequestType | null>(null);
  const [advanceGuideOpen, setAdvanceGuideOpen] = useState(false);
  const submitAdvance = (draft: AdvanceDraft) => {
    if (advanceFormFor && advanceFormFor !== 'new') {
      setAdvanceRequests((prev) => prev.map((r) => (r.id === advanceFormFor ? { ...r, ...draft } : r)));
      showToast('Request updated.');
    } else {
      setAdvanceRequests((prev) => [
        {
          ...draft,
          id: `adv-${Date.now()}`,
          staffName: resignationUser.staffName,
          staffCode: resignationUser.staffCode,
          // EV loans go straight to the CTM (Employee > CTM > HR > Finance)
          status: isEvLoan(draft.type) ? 'CTM Review Pending' : 'Manager Review Pending',
          submittedOn: toISODate(new Date()),
          rcUploaded: isEvLoan(draft.type) ? false : undefined,
          comments: [],
        },
        ...prev,
      ]);
      setAdvanceSubmittedType(draft.type);
      if (!isManager && !isEvLoan(draft.type)) {
        pushNotification('Manager', {
          category: 'Adv. Salary',
          title: `Advance salary request from ${resignationUser.staffName}`,
          body: `${formatAdvanceINR(draft.amount)} over ${draft.months} months. Review it in Team's Requests.`,
          link: 'advance-salary',
          actionRequired: true,
        });
      }
    }
    setAdvanceFormFor(null);
  };
  // Reporting manager's decision: approved requests move on to the CTM
  const reviewAdvance = (id: string, decision: AdvanceDecision, comment: string) => {
    const req = advanceRequests.find((r) => r.id === id);
    const now = new Date().toISOString();
    setAdvanceRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: decision === 'Approved' ? 'Manager Approved' : 'Manager Rejected',
              comments: [
                ...r.comments,
                ...(comment ? [{ id: `c-${Date.now()}`, author: ADVANCE_MANAGER, role: 'Manager' as const, text: comment, createdAt: now }] : []),
                {
                  id: `c-${Date.now()}-s`,
                  author: 'System',
                  role: 'System' as const,
                  text: `${decision === 'Approved' ? 'Approved' : 'Rejected'} by ${ADVANCE_MANAGER}.${
                    decision === 'Approved' ? ' Sent to the CTM for review.' : ''
                  }`,
                  createdAt: now,
                },
              ],
            }
          : r
      )
    );
    showToast(decision === 'Approved' ? 'Request approved and sent to the CTM.' : 'Request rejected.');
    if (req?.staffName === CURRENT_STAFF.staffName) {
      pushNotification('Staff', {
        category: 'Adv. Salary',
        title: `Your advance salary request was ${decision.toLowerCase()}`,
        body: `${formatAdvanceINR(req.amount)} over ${req.months} months${comment ? ` — "${comment}"` : ''}`,
        link: 'advance-salary',
      });
    }
  };
  // My Profile details (view mode by default; "Edit Profile" opens it straight in edit mode)
  const [myProfile, setMyProfile] = useState<MyProfileData>(MY_PROFILE_SEED);
  // My Team > Edit Details: manager edits a member's full profile (saved per staff code)
  const [editingMemberCode, setEditingMemberCode] = useState<string | null>(null);
  const [teamProfiles, setTeamProfiles] = useState<Record<string, MyProfileData>>({});
  // Leaving My Team closes any open member profile
  useEffect(() => {
    if (appTab !== 'more' || moreModule !== 'my-team') setEditingMemberCode(null);
  }, [appTab, moreModule]);
  const [myProfileStartEditing, setMyProfileStartEditing] = useState(false);
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

  // Assets module: one shared list so a staff member's return request shows on the manager's Team tab
  const [assets, setAssets] = useState<AssetRecord[]>(ASSETS_SEED);

  // Support › Cab Request: one shared list so manager decisions reflect on the staff side
  const [cabRequests, setCabRequests] = useState<CabRequest[]>(CAB_REQUESTS_SEED);
  /** 'new' = raising a request, an id = editing it, null = list */
  const [cabFormFor, setCabFormFor] = useState<string | null>(null);
  const [cabSubmitted, setCabSubmitted] = useState(false);

  const isManager = userRole === 'Manager';
  const myOTRequests = isManager ? managerOTRequests : staffOTRequests;
  // Identity used for the resignation module: staff = John, manager = his reporting manager
  const resignationUser = isManager
    ? { staffName: REPORTING_MANAGER, staffCode: 'A01120', designation: 'Design Manager', department: 'Product Design' }
    : CURRENT_STAFF;
  const myResignations = isManager ? managerResignations : resignations;
  // Fills the WFH/Hybrid Staff Declaration
  const declarant: Declarant = isManager
    ? {
        name: resignationUser.staffName,
        staffCode: resignationUser.staffCode,
        designation: resignationUser.designation,
        department: resignationUser.department,
        personalEmail: 'naveendas.home@gmail.com',
        officialEmail: 'naveen.das@my-cpe.com',
      }
    : {
        name: resignationUser.staffName,
        staffCode: resignationUser.staffCode,
        designation: resignationUser.designation,
        department: resignationUser.department,
        personalEmail: String(myProfile.values.personalEmail ?? ''),
        officialEmail: String(myProfile.values.officialEmail ?? ''),
      };
  const myAdvanceRequests = advanceRequests.filter((r) => r.staffName === resignationUser.staffName);

  const requestAssetReturn = (ids: string[]) => {
    const today = toISODate(new Date());
    setAssets((prev) =>
      prev.map((a) => (ids.includes(a.id) && a.status === 'Assigned' ? { ...a, status: 'Return Requested', returnRequestedOn: today } : a))
    );
    showToast(ids.length === 1 ? 'Return requested. IT will collect it from your desk.' : `Return requested for ${ids.length} assets.`);
    if (!isManager) {
      pushNotification('Manager', {
        category: 'Assets',
        title: `Asset return requested by ${resignationUser.staffName}`,
        body: `${ids.length} ${ids.length === 1 ? 'asset is' : 'assets are'} being handed back to IT. See Team's Assets.`,
        link: 'assets',
      });
    }
  };
  const setMyResignations = isManager ? setManagerResignations : setResignations;

  const submitCabRequest = (draft: CabDraft) => {
    if (cabFormFor && cabFormFor !== 'new') {
      setCabRequests((prev) => prev.map((r) => (r.id === cabFormFor ? { ...r, ...draft } : r)));
      showToast('Cab request updated.');
    } else {
      setCabRequests((prev) => [
        {
          ...draft,
          id: `cab-${Date.now()}`,
          staffName: resignationUser.staffName,
          staffCode: resignationUser.staffCode,
          status: 'Pending',
          submittedOn: toISODate(new Date()),
        },
        ...prev,
      ]);
      setCabSubmitted(true);
      if (!isManager) {
        pushNotification('Manager', {
          category: 'Cab Request',
          title: `Cab request from ${resignationUser.staffName}`,
          body: `${cabTitle(draft)} · pickup at ${draft.pickupTime}. Review it in Team's Requests.`,
          link: 'cab-request',
          actionRequired: true,
        });
      }
    }
    setCabFormFor(null);
  };
  const closeCabRequest = (id: string, how: 'cancel' | 'stop') => {
    const today = toISODate(new Date());
    setCabRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: how === 'stop' ? 'Terminated' : 'Cancelled', terminatedOn: how === 'stop' ? today : r.terminatedOn } : r
      )
    );
    showToast(how === 'stop' ? 'Daily cab stopped from today.' : 'Cab request cancelled.');
  };
  const reviewCabRequest = (id: string, decision: CabDecision, comment: string) => {
    const req = cabRequests.find((r) => r.id === id);
    setCabRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: decision, review: { by: CAB_MANAGER, comment, on: toISODate(new Date()) } } : r))
    );
    showToast(decision === 'Approved' ? 'Cab request approved.' : 'Cab request rejected.');
    if (req?.staffName === CURRENT_STAFF.staffName) {
      pushNotification('Staff', {
        category: 'Cab Request',
        title: `Your cab request was ${decision.toLowerCase()}`,
        body: `${cabTitle(req)} · ${req.pickupTime}${comment ? ` — "${comment}"` : ''}`,
        link: 'cab-request',
      });
    }
  };

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
    if (!isManager) {
      pushNotification('Manager', {
        category: 'Resignation',
        title: `Resignation submitted by ${resignationUser.staffName}`,
        body: `Last working day would be ${data.lastWorkingDate}. Review it in Team Resignations.`,
        link: 'resignation',
        actionRequired: true,
      });
    }
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
    if (resignations.some((x) => x.id === id)) {
      pushNotification('Staff', {
        category: 'Resignation',
        title: `Your resignation was ${decision.toLowerCase()}`,
        body: comment ? `${ATTENDANCE_REVIEWER}: “${comment}”` : `Reviewed by ${ATTENDANCE_REVIEWER}.`,
        link: 'resignation',
      });
    }
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
    records
      .filter((x) => idSet.has(x.id))
      .forEach((x) =>
        pushNotification('Staff', {
          category: 'Attendance',
          title: `Attendance edit ${verb} for ${x.dateFormatted}`,
          body: comment ? `${ATTENDANCE_REVIEWER}: “${comment}”` : `Reviewed by ${ATTENDANCE_REVIEWER}.`,
          link: 'attendance',
        })
      );
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

  const myNotifications = isManager ? managerNotifications : staffNotifications;
  const setMyNotifications = isManager ? setManagerNotifications : setStaffNotifications;
  const unreadNotifications = myNotifications.filter((n) => !n.read).length;

  const openNotification = (n: AppNotification) => {
    setMyNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (!n.link) return;
    setIsNotificationsOpen(false);
    setIsProfileOpen(false);
    setProfileModule(null);
    setCelebrationsTab(null);
    setMoreModule(null);
    setAttendanceFromMore(false);
    switch (n.link) {
      case 'attendance':
      case 'leaves':
        setActiveModuleTab(n.link === 'leaves' ? 'Leaves' : 'Attendance');
        setAppTab('attendance');
        break;
      case 'work-timing':
        setIsRequestingFlex(false);
        setEditingFlex(null);
        setAppTab('more');
        setMoreModule('work-timing');
        break;
      case 'ot-request':
        setIsAddingOT(false);
        setAppTab('more');
        setMoreModule('ot-request');
        break;
      case 'cab-request':
        setAppTab('home');
        setProfileModuleFromApp(false);
        setIsProfileOpen(true);
        setCabFormFor(null);
        setProfileModule('Cab Request');
        break;
      case 'wfo':
        setSelectedWFORecord(null);
        setActiveModuleTab('WFO Days');
        setAppTab('attendance');
        break;
      case 'advance-salary':
        setAppTab('home');
        setProfileModuleFromApp(false);
        setIsProfileOpen(true);
        setAdvanceFormFor(null);
        setProfileModule('Adv. Salary & EV Loan');
        break;
      case 'tickets':
      case 'resignation':
      case 'assets':
        setAppTab('home');
        setProfileModuleFromApp(false);
        setIsProfileOpen(true);
        setProfileModule(n.link === 'tickets' ? 'Tickets' : n.link === 'assets' ? 'Asset' : 'Resignation');
        break;
      case 'celebrations':
        setAppTab('home');
        setCelebrationsTab('Birthdays');
        break;
    }
  };

  const handleAppTabChange = (tab: AppTab) => {
    setCelebrationsTab(null);
    setIsProfileOpen(false);
    setProfileModule(null);
    setMoreModule(null);
    setOpenFeedPostId(null);
    setAttendanceFromMore(false);
    setIsNotificationsOpen(false);
    if (tab === 'attendance') setActiveModuleTab('Attendance');
    // Leaves lives on the Attendance & Leaves screen
    if (tab === 'leaves') {
      setActiveModuleTab('Leaves');
      setAppTab('attendance');
      return;
    }
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
  // Regular (non-edit) days for the team: John's own recent days + the rest of the team
  const myCycleRecords = records.filter((r) => r.date >= TEAM_CYCLE.from && r.date <= TEAM_CYCLE.to);
  const teamDailyAttendance = [
    ...myCycleRecords.filter((r) => !r.editRequested).map((r) => ({ ...r, staffCode: r.staffCode ?? ATTENDANCE_STAFF_CODE })),
    // Days of the cycle not yet in John's own records
    ...generateMemberDays(
      { staffName: CURRENT_STAFF.staffName, staffCode: ATTENDANCE_STAFF_CODE, workMode: 'Office', branch: 'Gota - Ahmedabad' },
      0,
      new Set(myCycleRecords.map((r) => r.date))
    ),
    ...TEAM_DAILY_ATTENDANCE_SEED,
  ];
  const kpis: AttendanceKPIsType = currentMonth.kpis;

  // Active Sheets & Dedicated Views
  const [selectedPunchRecord, setSelectedPunchRecord] = useState<AttendanceRecord | null>(null);
  const [selectedEditRecord, setSelectedEditRecord] = useState<AttendanceRecord | null>(null);
  const [applyingLeaveRecord, setApplyingLeaveRecord] = useState<AttendanceRecord | null>(null);
  const [selectedWFORecord, setSelectedWFORecord] = useState<WFORecord | null>(null);
  const [editingWFORecordFromDetails, setEditingWFORecordFromDetails] = useState<WFORecord | null>(null);
  // WFO Days: one shared list so the manager's decisions reflect on the staff side
  const [wfoRecords, setWfoRecords] = useState<WFORecord[]>([...INITIAL_WFO_RECORDS, ...TEAM_WFO_RECORDS_SEED]);
  const [wfoTab, setWfoTab] = useState<'mine' | 'team'>('team');
  const myWFORecords = wfoRecords.filter((r) => r.staffName === resignationUser.staffName);
  const teamWFOList = wfoRecords.filter((r) => WFO_TEAM.includes(r.staffName));
  const submitWFO = (month: string, year: number, days: number, idToEdit?: string) => {
    // Guard: never create a second request for a month that already has one
    const duplicate = myWFORecords.some((r) => r.month === month && r.year === year && r.id !== idToEdit && r.status !== 'Rejected');
    if (duplicate) return;
    const fields = { month, year, days, monthYear: `${month} ${year}`, status: 'Pending' as const, review: undefined };
    if (idToEdit) {
      setWfoRecords((prev) => prev.map((r) => (r.id === idToEdit ? { ...r, ...fields } : r)));
      setSelectedWFORecord((sel) => (sel?.id === idToEdit ? { ...sel, ...fields } : sel));
    } else {
      setWfoRecords((prev) => [
        {
          ...fields,
          id: `wfo-${year}-${month.toLowerCase().slice(0, 3)}-${Date.now()}`,
          staffName: resignationUser.staffName,
          staffCode: resignationUser.staffCode,
          submittedAt: 'Just now',
        },
        ...prev,
      ]);
    }
    if (!isManager) {
      pushNotification('Manager', {
        category: 'WFO Days',
        title: `WFO days ${idToEdit ? 'updated' : 'submitted'} by ${resignationUser.staffName}`,
        body: `${month} ${year} · ${days} days (${formatWFOINR(wfoAllowanceFor(days))}). Review it in Team's WFO Days.`,
        link: 'wfo',
        actionRequired: true,
      });
    }
  };
  const reviewWFO = (id: string, decision: WFODecision, comment: string) => {
    const rec = wfoRecords.find((r) => r.id === id);
    setWfoRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: decision, review: { by: WFO_MANAGER, comment, on: toISODate(new Date()) } } : r))
    );
    showToast(decision === 'Approved' ? 'WFO days approved.' : 'WFO days rejected.');
    if (rec?.staffName === CURRENT_STAFF.staffName) {
      pushNotification('Staff', {
        category: 'WFO Days',
        title: `Your WFO days for ${rec.monthYear} were ${decision.toLowerCase()}`,
        body: comment ? `${WFO_MANAGER}: “${comment}”` : `${rec.days} days · reviewed by ${WFO_MANAGER}.`,
        link: 'wfo',
      });
    }
  };
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
    leaveRequests
      .filter((x) => idSet.has(x.id))
      .forEach((x) =>
        pushNotification('Staff', {
          category: 'Leaves',
          title: `Leave ${verb}`,
          body: `Your ${x.type} for ${x.dateRange} was ${verb} by ${ATTENDANCE_REVIEWER}${comment ? ` — “${comment}”` : '.'}`,
          link: 'leaves',
        })
      );
    showToast(ids.length === 1 ? `Leave request ${verb}.` : `${ids.length} leave requests ${verb}.`);
  };

  const myFlexRequests = isManager ? managerFlexRequests : flexRequests;
  const setMyFlexRequests = isManager ? setManagerFlexRequests : setFlexRequests;
  // Staff member's requests + the rest of the team's: pending first, then newest
  const teamFlexList = [...flexRequests, ...teamFlexRequests].sort((a, b) =>
    a.status === 'Pending' && b.status !== 'Pending'
      ? -1
      : b.status === 'Pending' && a.status !== 'Pending'
        ? 1
        : b.submittedAt.localeCompare(a.submittedAt)
  );

  const threadNote = (author: string, role: 'Staff' | 'Manager' | 'System', text: string) => ({
    id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    author,
    role,
    text,
    createdAt: new Date().toISOString(),
  });

  // Applies a change to whichever list holds the request (staff, team or manager's own)
  const updateFlex = (id: string, change: (r: FlexRequest) => FlexRequest) => {
    const apply = (list: FlexRequest[]) => list.map((r) => (r.id === id ? change(r) : r));
    setFlexRequests(apply);
    setTeamFlexRequests(apply);
    setManagerFlexRequests(apply);
  };

  // Prototype stand-in for the IT team: ~3.5s after a request is approved, IT marks its review done
  const IT_REVIEW_DELAY_MS = 3500;
  const itReviewTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const approved = [...flexRequests, ...teamFlexRequests, ...managerFlexRequests].filter((r) => r.status === 'Approved');
    approved.forEach((req) => {
      if (itReviewTimers.current.has(req.id)) return;
      const timer = setTimeout(() => {
        itReviewTimers.current.delete(req.id);
        const itReviewedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        updateFlex(req.id, (r) =>
          r.status !== 'Approved'
            ? r
            : {
                ...r,
                status: 'IT Review Done',
                itReviewedBy: 'IT Support',
                itReviewedAt,
                comments: [
                  ...(r.comments ?? []),
                  threadNote(
                    'System',
                    'System',
                    r.wfh && Object.keys(r.wfh.assets).length ? 'IT review done — assets will be dispatched to the delivery address' : 'IT review done'
                  ),
                ],
              }
        );
        showToast(`IT review done for ${req.staffName.split(' ')[0]}'s ${req.type} request.`);
        if (req.staffName === CURRENT_STAFF.staffName) {
          pushNotification('Staff', {
            category: 'Work Timing',
            title: `IT review done for your ${req.type} request`,
            body: req.wfh && Object.keys(req.wfh.assets).length
              ? 'Your assets will be dispatched to the delivery address. The signed agreement is ready to view.'
              : 'Everything is set up. The arrangement is now active.',
            link: 'work-timing',
          });
        }
      }, IT_REVIEW_DELAY_MS);
      itReviewTimers.current.set(req.id, timer);
    });
    // updateFlex / threadNote / showToast are stable enough for this demo timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flexRequests, teamFlexRequests, managerFlexRequests]);
  useEffect(() => {
    const timers = itReviewTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      // Forget them too, so a remount (e.g. React StrictMode in dev) schedules them again
      timers.clear();
    };
  }, []);

  const commentOnFlex = (id: string, text: string) =>
    updateFlex(id, (r) => ({
      ...r,
      comments: [...(r.comments ?? []), threadNote(resignationUser.staffName, isManager ? 'Manager' : 'Staff', text)],
    }));

  // Manager decision on flexibility requests → reflected on the staff member's list
  const reviewFlex = (ids: string[], decision: FlexDecision, comment: string) => {
    const reviewedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const idSet = new Set(ids);
    const apply = (list: FlexRequest[]) =>
      list.map((r) =>
        idSet.has(r.id)
          ? {
              ...r,
              status: decision,
              managerComment: comment || undefined,
              reviewedBy: ATTENDANCE_REVIEWER,
              reviewedAt,
              comments: [
                ...(r.comments ?? []),
                threadNote('System', 'System', `${decision} by ${ATTENDANCE_REVIEWER}${comment ? `: “${comment}”` : ''}`),
              ],
            }
          : r
      );
    setFlexRequests(apply);
    setTeamFlexRequests(apply);
    const verb = decision === 'Approved' ? 'approved' : 'rejected';
    flexRequests
      .filter((x) => idSet.has(x.id))
      .forEach((x) =>
        pushNotification('Staff', {
          category: 'Work Timing',
          title: `${x.type} request ${verb}`,
          body: comment ? `${ATTENDANCE_REVIEWER}: “${comment}”` : `Reviewed by ${ATTENDANCE_REVIEWER}.`,
          link: 'work-timing',
        })
      );
    showToast(ids.length === 1 ? `Request ${verb}.` : `${ids.length} requests ${verb}.`);
  };

  // Staff member's OT request + the rest of the team's (view-only for the manager), newest first
  const teamOTList = [...staffOTRequests, ...teamOTRequests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

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
    const rec = records.find((x) => x.id === recordId);
    pushNotification('Manager', {
      category: 'Attendance',
      title: `Attendance edit request from ${CURRENT_STAFF.staffName}`,
      body: `${rec?.dateFormatted ?? ''} · ${reason}${note ? ` — “${note}”` : ''}`,
      link: 'attendance',
      actionRequired: true,
    });
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

  // Which screen is showing (mirrors the render chain below) and how deep it sits, for the slide transition
  const editingMember = moreModule === 'my-team' ? myTeam.find((m) => m.staffCode === editingMemberCode) ?? null : null;
  // The signed-in manager is in their own team list; their edits go to My Profile
  const isSelf = (m: TeamMemberRecord) => m.staffCode === myProfile.values.employeeId;
  const memberProfile = (m: TeamMemberRecord) =>
    isSelf(m) ? myProfile : teamProfiles[m.staffCode] ?? profileForMember(m, MY_PROFILE_SEED);

  const screen = ((): { key: string; depth: number } => {
    if (isNotificationsOpen) return { key: 'notifications', depth: 1 };
    if (isProfileOpen) {
      if (!profileModule) return { key: 'profile', depth: 1 };
      const inForm =
        (profileModule === 'Staff Review' && isEvaluating) ||
        (profileModule === 'Tickets' && isCreatingTicket) ||
        (profileModule === 'Resignation' && isApplyingResignation) ||
        (profileModule === 'Adv. Salary & EV Loan' && Boolean(advanceFormFor)) ||
        (profileModule === 'Cab Request' && Boolean(cabFormFor));
      return { key: `profile/${profileModule}${inForm ? '/form' : ''}`, depth: inForm ? 3 : 2 };
    }
    if (celebrationsTab) return { key: 'celebrations', depth: 1 };
    if (appTab === 'more' && moreModule === 'my-team') {
      return { key: `more/my-team${editingMember ? '/profile' : ''}`, depth: editingMember ? 2 : 1 };
    }
    if (appTab === 'more' && moreModule === 'company-feed') {
      return { key: `more/company-feed${openFeedPost ? '/post' : ''}`, depth: openFeedPost ? 2 : 1 };
    }
    if (appTab === 'more' && (moreModule === 'work-timing' || moreModule === 'ot-request')) {
      const inForm = moreModule === 'work-timing' ? isRequestingFlex || Boolean(editingFlex) : isAddingOT;
      return { key: `more/${moreModule}${inForm ? '/form' : ''}`, depth: inForm ? 2 : 1 };
    }
    if (appTab !== 'attendance') return { key: appTab, depth: 0 };
    if (editingLeave) return { key: 'attendance/edit-leave', depth: 2 };
    if (isApplyingLeaveOpen) return { key: 'attendance/apply-leave', depth: 2 };
    if (selectedLeave) return { key: 'attendance/leave', depth: 1 };
    if (applyingLeaveRecord) return { key: 'attendance/apply-for-day', depth: 1 };
    if (selectedWFORecord) return { key: 'attendance/wfo', depth: 1 };
    return { key: 'attendance', depth: 0 };
  })();

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
              ) : (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <AppHeader
                    fullName="John Smith"
                    profilePhoto={profilePhoto}
                    unreadNotifications={unreadNotifications}
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                    onGoHome={() => handleAppTabChange('home')}
                    onOpenProfile={() => {
                      setIsNotificationsOpen(false);
                      setProfileModule(null);
                      setIsProfileOpen(true);
                    }}
                  />
              <ScreenTransition screenKey={screen.key} depth={screen.depth}>
              {isNotificationsOpen ? (
                <NotificationsView
                  notifications={myNotifications}
                  onBack={() => setIsNotificationsOpen(false)}
                  onOpen={openNotification}
                  onMarkAllRead={() => setMyNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                />
              ) : isProfileOpen && profileModule === 'My Profile' ? (
                <MyProfileView
                  profile={myProfile}
                  photoUrl={profilePhoto}
                  startEditing={myProfileStartEditing}
                  onBack={() => setProfileModule(null)}
                  onNotify={showToast}
                  onSave={(next) => {
                    setMyProfile(next);
                    showToast('Profile updated.');
                  }}
                />
              ) : isProfileOpen && profileModule === 'Staff Review' && isEvaluating ? (
                <AnnualReviewView
                  cycles={reviewCycles}
                  onBack={() => setIsEvaluating(false)}
                  onSaveDraft={(id, form) => {
                    setReviewCycles((prev) => prev.map((c) => (c.id === id ? { ...c, form } : c)));
                    showToast('Draft saved. You can finish it later.');
                  }}
                  onSubmit={(id, form) => {
                    setReviewCycles((prev) =>
                      prev.map((c) => (c.id === id ? { ...c, form, status: 'Submitted', submittedOn: toISODate(new Date()) } : c))
                    );
                    setIsEvaluating(false);
                    showToast('Annual review submitted.');
                  }}
                />
              ) : isProfileOpen && profileModule === 'Staff Review' ? (
                <StaffReviewView
                  onBack={closeProfileModule}
                  onStartEvaluation={() => setIsEvaluating(true)}
                  evaluationSubmitted={!reviewCycles.some((c) => c.status === 'Open')}
                />
              ) : isProfileOpen && profileModule === 'Relevant Contacts' ? (
                <RelevantContactsView onBack={closeProfileModule} onToast={showToast} />
              ) : isProfileOpen && profileModule === 'VOIP Directory' ? (
                <VoipDirectoryView
                  firstName={resignationUser.staffName.split(' ')[0]}
                  onBack={closeProfileModule}
                  onToast={showToast}
                />
              ) : isProfileOpen && profileModule === 'Asset' ? (
                <AssetsView
                  key={userRole}
                  firstName={resignationUser.staffName.split(' ')[0]}
                  assets={assets.filter((a) => a.staffName === resignationUser.staffName)}
                  onBack={closeProfileModule}
                  onRequestReturn={requestAssetReturn}
                  team={isManager ? { assets: assets.filter((a) => TEAM_ASSET_MEMBERS.includes(a.staffName)) } : undefined}
                />
              ) : isProfileOpen && profileModule === 'Cab Request' && cabFormFor ? (
                <CabRequestFormView
                  key={cabFormFor}
                  requests={cabRequests.filter((r) => r.staffName === resignationUser.staffName)}
                  initial={cabRequests.find((r) => r.id === cabFormFor)}
                  onBack={() => setCabFormFor(null)}
                  onSubmit={submitCabRequest}
                />
              ) : isProfileOpen && profileModule === 'Cab Request' ? (
                <CabRequestView
                  key={userRole}
                  firstName={resignationUser.staffName.split(' ')[0]}
                  requests={cabRequests.filter((r) => r.staffName === resignationUser.staffName)}
                  onBack={closeProfileModule}
                  onNew={() => setCabFormFor('new')}
                  onEdit={(id) => setCabFormFor(id)}
                  onCancel={(id) => closeCabRequest(id, 'cancel')}
                  onStop={(id) => closeCabRequest(id, 'stop')}
                  submitted={cabSubmitted}
                  onDismissSubmitted={() => setCabSubmitted(false)}
                  team={
                    isManager
                      ? { requests: cabRequests.filter((r) => CAB_TEAM.includes(r.staffName)), onReview: reviewCabRequest }
                      : undefined
                  }
                />
              ) : isProfileOpen && profileModule === 'Adv. Salary & EV Loan' && advanceFormFor ? (
                <AdvanceRequestView
                  key={advanceFormFor}
                  requests={myAdvanceRequests}
                  initial={advanceRequests.find((r) => r.id === advanceFormFor)}
                  onBack={() => setAdvanceFormFor(null)}
                  onOpenGuidelines={() => setAdvanceGuideOpen(true)}
                  onSubmit={submitAdvance}
                />
              ) : isProfileOpen && profileModule === 'Adv. Salary & EV Loan' ? (
                <AdvanceSalaryView
                  key={userRole}
                  firstName={resignationUser.staffName.split(' ')[0]}
                  currentUser={resignationUser.staffName}
                  requests={myAdvanceRequests}
                  onBack={closeProfileModule}
                  onOpenGuidelines={() => setAdvanceGuideOpen(true)}
                  onRaise={() => setAdvanceFormFor('new')}
                  onEdit={(id) => setAdvanceFormFor(id)}
                  onWithdraw={(id) => {
                    setAdvanceRequests((prev) =>
                      prev.map((r) =>
                        r.id === id
                          ? {
                              ...r,
                              status: 'Withdrawn',
                              comments: [
                                ...r.comments,
                                {
                                  id: `c-${Date.now()}`,
                                  author: 'System',
                                  role: 'System',
                                  text: `Request withdrawn by ${resignationUser.staffName}.`,
                                  createdAt: new Date().toISOString(),
                                },
                              ],
                            }
                          : r
                      )
                    );
                    showToast('Request withdrawn.');
                  }}
                  onComment={(id, text) =>
                    setAdvanceRequests((prev) =>
                      prev.map((r) =>
                        r.id === id
                          ? {
                              ...r,
                              comments: [
                                ...r.comments,
                                {
                                  id: `c-${Date.now()}`,
                                  author: resignationUser.staffName,
                                  // A manager commenting on a team member's request speaks as the manager
                                  role: isManager ? 'Manager' : 'Staff',
                                  text,
                                  createdAt: new Date().toISOString(),
                                },
                              ],
                            }
                          : r
                      )
                    )
                  }
                  submittedType={advanceSubmittedType}
                  onDismissSubmitted={() => setAdvanceSubmittedType(null)}
                  team={
                    isManager
                      ? { requests: advanceRequests.filter((r) => ADVANCE_TEAM.includes(r.staffName)), onReview: reviewAdvance }
                      : undefined
                  }
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
                  onBack={closeProfileModule}
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
                  onBack={closeProfileModule}
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
                  name="John Smith"
                  email="john.smith@my-cpe.com"
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
                    setProfileModuleFromApp(false);
                    if (label === 'My Profile' || label === 'Edit Profile') {
                      setMyProfileStartEditing(label === 'Edit Profile');
                      setProfileModule('My Profile');
                    } else if (label === 'Staff Review') {
                      setIsEvaluating(false);
                      setProfileModule('Staff Review');
                    } else if (label === 'Adv. Salary & EV Loan') {
                      setAdvanceFormFor(null);
                      setProfileModule(label);
                    } else if (label === 'Cab Request') {
                      setCabFormFor(null);
                      setProfileModule(label);
                    } else if (
                      label === 'Resignation' ||
                      label === 'Tickets' ||
                      label === 'Relevant Contacts' ||
                      label === 'Asset' ||
                      label === 'VOIP Directory'
                    ) {
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
                  />
                  <AppBottomNav activeTab="home" onTabChange={handleAppTabChange} />
                </div>
              ) : appTab === 'home' ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <HomeDashboard
                    userName="John"
                    todaysBirthdays={BIRTHDAYS.filter((b) => b.inDays === 0)}
                    upcomingHolidayCount={holidaysNext30Days}
                    onOpenAttendance={() => handleAppTabChange('attendance')}
                    onOpenCelebrations={(tab) => setCelebrationsTab(tab)}
                    onViewLog={() => setSelectedPunchRecord(records[0] ?? null)}
                    onWish={(person) => setWishTarget({ person, kind: 'birthday' })}
                    onComingSoon={(feature) => {
                      if (feature === 'Staff Review') {
                        setProfileModuleFromApp(true);
                        setIsEvaluating(false);
                        setProfileModule('Staff Review');
                        setIsProfileOpen(true);
                      } else {
                        showToast(`${feature} is coming soon.`);
                      }
                    }}
                  />
                  <AppBottomNav activeTab="home" onTabChange={handleAppTabChange} />
                </div>
              ) : appTab === 'more' && moreModule === 'work-timing' && (isRequestingFlex || editingFlex) ? (
                <RequestFlexibilityView
                  key={editingFlex?.id ?? 'new'}
                  signerName={resignationUser.staffName}
                  declarant={declarant}
                  initialRequest={editingFlex}
                  onExit={() => {
                    setIsRequestingFlex(false);
                    setEditingFlex(null);
                  }}
                  onSubmit={(req) => {
                    if (editingFlex) {
                      // Replace the whole request; it stays pending until the manager decides
                      const updated: FlexRequest = {
                        ...req,
                        id: editingFlex.id,
                        staffName: editingFlex.staffName,
                        staffCode: editingFlex.staffCode,
                        status: 'Pending',
                        submittedAt: editingFlex.submittedAt,
                        updatedAt: new Date().toISOString(),
                        comments: [
                          ...(editingFlex.comments ?? []),
                          threadNote('System', 'System', `Request updated by ${editingFlex.staffName}`),
                        ],
                      };
                      setMyFlexRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                      setEditingFlex(null);
                      showToast('Request updated. Your manager will see the latest version.');
                    } else {
                      setMyFlexRequests((prev) => [
                        {
                          ...req,
                          id: `flex-${Date.now()}`,
                          staffName: resignationUser.staffName,
                          staffCode: resignationUser.staffCode,
                          status: 'Pending',
                          submittedAt: new Date().toISOString(),
                        },
                        ...prev,
                      ]);
                      setIsRequestingFlex(false);
                      showToast('Flexibility request sent to your reporting manager.');
                      if (!isManager) {
                        pushNotification('Manager', {
                          category: 'Work Timing',
                          title: `New flexibility request from ${resignationUser.staffName}`,
                          body: `${req.type}${req.duration ? ` · ${req.duration}` : ''}. Needs your approval.`,
                          link: 'work-timing',
                          actionRequired: true,
                        });
                      }
                    }
                  }}
                />
              ) : appTab === 'more' && moreModule === 'my-team' && isManager ? (
                editingMember ? (
                  <MyProfileView
                    key={editingMember.staffCode}
                    profile={memberProfile(editingMember)}
                    photoUrl={isSelf(editingMember) ? profilePhoto : null}
                    title="Staff Profile"
                    startEditing
                    onBack={() => setEditingMemberCode(null)}
                    onNotify={showToast}
                    onSave={(next) => {
                      if (isSelf(editingMember)) setMyProfile(next);
                      else setTeamProfiles((prev) => ({ ...prev, [editingMember.staffCode]: next }));
                      showToast(`${editingMember.staffName}'s details updated.`);
                    }}
                  />
                ) : (
                <MyTeamView
                  members={myTeam}
                  onBack={() => setMoreModule(null)}
                  onEditDetails={(member) => setEditingMemberCode(member.staffCode)}
                  onSubmitReview={(member) => {
                    // Opens the Staff Review flow; Back returns to My Team
                    setIsEvaluating(false);
                    setProfileModuleFromApp(true);
                    setProfileModule('Staff Review');
                    setIsProfileOpen(true);
                    showToast(`Reviewing ${member.staffName}.`);
                  }}
                />
                )
              ) : appTab === 'more' && moreModule === 'company-feed' && openFeedPost ? (
                <FeedPostView
                  post={openFeedPost}
                  reaction={feedReactions[openFeedPost.id] ?? null}
                  onBack={() => setOpenFeedPostId(null)}
                  onReact={(r) => setFeedReactions((prev) => ({ ...prev, [openFeedPost.id]: r }))}
                  onOpenProfile={() => {
                    setProfileModuleFromApp(true);
                    setProfileModule('My Profile');
                    setIsProfileOpen(true);
                  }}
                />
              ) : appTab === 'more' && moreModule === 'company-feed' ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <CompanyFeedView
                    posts={feedPosts}
                    reactions={feedReactions}
                    category={feedCategory}
                    onCategoryChange={setFeedCategory}
                    onBack={() => setMoreModule(null)}
                    onOpenPost={(post) => {
                      // Opening a post marks it read
                      setFeedPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, unread: false } : p)));
                      setOpenFeedPostId(post.id);
                    }}
                    onReact={(id, r) => setFeedReactions((prev) => ({ ...prev, [id]: r }))}
                  />
                  <AppBottomNav activeTab="more" onTabChange={handleAppTabChange} />
                </div>
              ) : appTab === 'more' && moreModule === 'work-timing' ? (
                <WorkTimingView
                  key={userRole}
                  firstName={resignationUser.staffName.split(' ')[0]}
                  requests={myFlexRequests}
                  onBack={() => setMoreModule(null)}
                  onRequestFlexibility={() => {
                    setEditingFlex(null);
                    setIsRequestingFlex(true);
                  }}
                  onEdit={(req) => setEditingFlex(req)}
                  currentUser={resignationUser.staffName}
                  onComment={commentOnFlex}
                  onDownloadAgreement={(req) =>
                    showToast(`Agreement for ${req.type} downloaded as WFA-${req.id.replace(/\D/g, '').slice(-6).padStart(6, '0')}.pdf`)
                  }
                  team={isManager ? { requests: teamFlexList, onReview: reviewFlex } : undefined}
                />
              ) : appTab === 'more' && moreModule === 'ot-request' && isAddingOT && myOTRequests.length === 0 ? (
                <AddOTRequestView
                  onBack={() => setIsAddingOT(false)}
                  onSubmit={(req) => {
                    // Only one OT request per person; it's approved as soon as it's submitted
                    (isManager ? setManagerOTRequests : setStaffOTRequests)((prev) =>
                      prev.length
                        ? prev
                        : [
                            {
                              ...req,
                              id: `ot-${Date.now()}`,
                              staffName: resignationUser.staffName,
                              staffCode: resignationUser.staffCode,
                              assignedHours: 0,
                              status: 'Approved',
                              submittedAt: new Date().toISOString(),
                            },
                          ]
                    );
                    setIsAddingOT(false);
                    showToast('OT availability submitted and approved.');
                    if (!isManager) {
                      // FYI only: managers can view it, there's nothing to approve
                      pushNotification('Manager', {
                        category: 'Work Timing',
                        title: `${resignationUser.staffName} shared their OT availability`,
                        body: `${req.domain} · ${req.country}${req.extraHours ? ` · ${req.extraHours} extra hrs` : ''}. View it in Team's Availability.`,
                        link: 'ot-request',
                      });
                    }
                  }}
                />
              ) : appTab === 'more' && moreModule === 'ot-request' ? (
                <OTRequestView
                  key={userRole}
                  firstName={resignationUser.staffName.split(' ')[0]}
                  requests={myOTRequests}
                  otHours={myLeaveBalance.otHours}
                  onBack={() => setMoreModule(null)}
                  onAddRequest={() => setIsAddingOT(true)}
                  onRaiseTicket={() => {
                    // Edits to a submitted OT request go through Tickets; Back returns here
                    setProfileModuleFromApp(true);
                    setProfileModule('Tickets');
                    setIsCreatingTicket(true);
                    setIsProfileOpen(true);
                  }}
                  team={isManager ? { requests: teamOTList } : undefined}
                />
              ) : appTab === 'more' ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <MoreView
                    role={userRole}
                    onOpenModule={(m) => {
                      if (m.id === 'my-team') {
                        setMoreModule(m.id);
                      } else if (m.id === 'company-feed') {
                        setOpenFeedPostId(null);
                        setMoreModule(m.id);
                      } else if (m.id === 'Attendance' || m.id === 'Leaves' || m.id === 'Holidays' || m.id === 'WFO Days') {
                        setSelectedWFORecord(null);
                        setActiveModuleTab(m.id);
                        setAppTab('attendance');
                        setAttendanceFromMore(true);
                      } else if (m.id === 'work-timing') {
                        setIsRequestingFlex(false);
                        setEditingFlex(null);
                        setMoreModule(m.id);
                      } else if (m.id === 'ot-request') {
                        setIsAddingOT(false);
                        setMoreModule(m.id);
                      } else if (
                        m.id === 'Resignation' ||
                        m.id === 'Tickets' ||
                        m.id === 'Relevant Contacts' ||
                        m.id === 'Asset' ||
                        m.id === 'VOIP Directory' ||
                        m.id === 'Adv. Salary & EV Loan' ||
                        m.id === 'Cab Request'
                      ) {
                        // Support modules live in the profile flow; Back returns to More
                        setIsApplyingResignation(false);
                        setIsCreatingTicket(false);
                        setAdvanceFormFor(null);
                        setCabFormFor(null);
                        setProfileModuleFromApp(true);
                        setProfileModule(m.id);
                        setIsProfileOpen(true);
                      } else {
                        showToast(`${m.label} is coming soon.`);
                      }
                    }}
                  />
                  <AppBottomNav activeTab="more" onTabChange={handleAppTabChange} />
                </div>
              ) : appTab !== 'attendance' ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <ComingSoonView
                    title={appTab === 'learning' ? 'Learning' : 'More'}
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
                    if (!isManager) {
                      pushNotification('Manager', {
                        category: 'Leaves',
                        title: `Leave request from ${resignationUser.staffName}`,
                        body: `${newReq.type} · ${newReq.dateRange} (${newReq.daysCount} ${newReq.daysCount === 1 ? 'day' : 'days'})`,
                        link: 'leaves',
                        actionRequired: true,
                      });
                    }
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
                        onClick={() => handleAppTabChange(attendanceFromMore ? 'more' : 'home')}
                        className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 transition-colors cursor-pointer"
                        aria-label="Back"
                      >
                        <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                      </button>
                      <h1 className="text-base font-bold text-[#1E293B] screen-title">
                        {activeModuleTab}
                      </h1>
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
                    <div className="flex-1 min-h-0 flex flex-col">
                      {isManager && (
                        <div className="shrink-0 px-4 pt-3 pb-1 bg-[#F8FAFC]">
                          <SegmentedTabs
                            ariaLabel="WFO Days view"
                            value={wfoTab}
                            onChange={setWfoTab}
                            options={[
                              { id: 'mine', label: 'My WFO Days' },
                              {
                                id: 'team',
                                label: "Team's WFO Days",
                                badge: teamWFOList.filter((r) => r.status === 'Pending').length,
                              },
                            ]}
                          />
                        </div>
                      )}
                      {isManager && wfoTab === 'team' ? (
                        <TeamWFOView records={teamWFOList} onReview={reviewWFO} />
                      ) : (
                        <WFODaysView
                          key={userRole}
                          records={myWFORecords}
                          onViewDetails={(rec) => setSelectedWFORecord(rec)}
                          onSubmit={(month, year, days, idToEdit) => {
                            submitWFO(month, year, days, idToEdit);
                            showToast(idToEdit ? 'WFO request updated successfully.' : 'WFO days submitted for approval.');
                          }}
                        />
                      )}
                    </div>
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
                      dailyRecords={teamDailyAttendance}
                      onReview={reviewAttendance}
                      onBulkReview={reviewAttendanceMany}
                      onViewLogs={(rec) => setSelectedPunchRecord(rec)}
                    />
                  ) : (
                  /* 2. Scrollable Attendance Content */
                  <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-20 space-y-3.5 no-scrollbar">
                  {/* 3. Date Range & Filter Row (top) */}
                  <div className="flex items-center gap-2.5">
                    {/* Date Range Selector Button */}
                    <button
                      type="button"
                      onClick={() => setIsFilterSheetOpen(true)}
                      className="flex-1 h-12 px-3.5 rounded-2xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 flex items-center justify-between shadow-2xs active:bg-slate-50 transition-colors cursor-pointer"
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
                          : 'bg-white border-slate-200/90 text-[#2F68FE] active:bg-slate-50'
                      }`}
                      aria-label="Filter Attendance"
                    >
                      <Filter className="w-4.5 h-4.5 stroke-[1.9]" />
                    </button>
                  </div>

                  {/* 4. 3-KPI Card Container */}
                  <AttendanceKPIs
                    kpis={kpis}
                    onOpenSummarySheet={() => setIsKPISummaryOpen(true)}
                  />

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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#2F68FE] bg-[#EFF6FF] active:bg-blue-200 transition-all cursor-pointer shadow-2xs border border-[#BFDBFE]/60"
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
                          className="mt-2 text-xs font-semibold text-[#2F68FE]"
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
                  <AppBottomNav activeTab={activeModuleTab === 'Leaves' ? 'leaves' : 'attendance'} onTabChange={handleAppTabChange} />
              </div>
            )}
              </ScreenTransition>
                </div>
              )}

            <AdvanceGuidelineSheet isOpen={advanceGuideOpen} onClose={() => setAdvanceGuideOpen(false)} />

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
                // KPIs follow the attendance cycle the selected range ends in
                const cycle = ATTENDANCE_MONTHS.findIndex((m) => to >= m.range.from && to <= m.range.to);
                if (cycle !== -1) setMonthIndex(cycle);
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
              existingRecords={myWFORecords}
              onSubmit={(month, year, days, idToEdit) => {
                submitWFO(month, year, days, idToEdit);
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
