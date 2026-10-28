import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ComingSoonView } from '../home/ComingSoonView';
import { DropdownSheetModeProvider } from '../../design-system/components/Dropdown';
import { AppHeader } from '../home/AppHeader';
import { APP_VERSION } from '../auth/AuthFlow';
import { ClientAppBottomNav, ClientTab, CLIENT_TAB_LABEL } from './home/ClientAppBottomNav';
import { ClientSideDrawer } from './home/ClientSideDrawer';
import { ClientDashboard } from './home/ClientDashboard';
import { ClientImportantUpdatesSheet } from './home/ClientImportantUpdatesSheet';
import { ClientServicesSheet } from './home/ClientServicesSheet';
import { ClientNewsInsightsSheet } from './home/ClientNewsInsightsSheet';
import { ClientAccountManagerSheet } from './home/ClientAccountManagerSheet';
import { ClientNoAccessView } from './home/ClientNoAccessView';
import { ClientRoleSheet } from './home/ClientRoleSheet';
import { ClientPermissionProvider } from './context/ClientPermissionContext';
import { CLIENT_CONTACT_ROLES, ClientContactRole, permissionFor } from './data/clientPermissionsData';
import { findClientModule } from './home/clientMenu';
import { ClientMyStaffView } from './staff/ClientMyStaffView';
import type { StaffProfileEdits } from './staff/ClientStaffDetailView';
import { ClientStaffMember, MY_STAFF_SEED, StaffProfileTab, staffFromHire } from './data/clientStaffData';
import { ClientAttendanceView } from './attendance/ClientAttendanceView';
import { AMEND_SEED, AmendRequest, AmendStatus, SET_OFF_REASON, pendingAmendCount } from './data/clientAttendanceData';
import { ClientWorkFlexibilityView } from './flexibility/ClientWorkFlexibilityView';
import { WORK_FLEX_SEED, WorkFlexPreferences, workFlexStaffFrom, workModeFromPrefs } from './data/clientWorkFlexData';
import { ClientMgmtFeeView } from './fees/ClientMgmtFeeView';
import { MGMT_FEE_CHARTS } from './data/clientMgmtFeeData';
import { ClientFeedbackView } from './feedback/ClientFeedbackView';
import { ClientSurvey, FEEDBACK_SURVEYS_SEED } from './data/clientFeedbackData';
import { ClientNotificationsView } from './notifications/ClientNotificationsView';
import { ClientUserProfileView } from './profile/ClientUserProfileView';
import { CLIENT_USER_PROFILE_SEED, ClientUserProfile } from './data/clientUserProfileData';
import { ClientCompanyProfileView } from './profile/ClientCompanyProfileView';
import { CLIENT_AGREEMENTS_SEED, CLIENT_COMPANY_PROFILE_SEED, ClientCompanyProfile } from './data/clientCompanyProfileData';
import { ClientContactsView } from './contacts/ClientContactsView';
import { CLIENT_CONTACTS_SEED, ClientContact } from './data/clientContactsData';
import { CLIENT_NOTIFICATIONS_SEED, ClientNotification } from './data/clientNotificationsData';
import { ClientDirectoryView } from './directory/ClientDirectoryView';
import { ClientInterviewsView } from './interviews/ClientInterviewsView';
import { SHORTLISTED_SEED, ShortlistedCandidate, isoOfDate } from './data/clientInterviewsData';
import { ClientTalentMarketplaceView } from './marketplace/ClientTalentMarketplaceView';
import { ClientRequirementsView } from './requirements/ClientRequirementsView';
import { OFFSHORE_LOCATIONS, REQUIREMENTS_SEED, StaffRequirement } from './data/clientRequirementsData';
import { HUB_PROFILES_SEED, HUB_SAVED_SEED } from './data/clientStaffHubData';
import { ClientHiringPricingView } from './pricing/ClientHiringPricingView';
import { ClientTimesheetsView } from './timesheets/ClientTimesheetsView';
import { ClientInvoicesView } from './invoices/ClientInvoicesView';
import { ClientBillingDetailsView } from './billing/ClientBillingDetailsView';
import { ClientInclusionsView } from './inclusions/ClientInclusionsView';
import { ClientTrainingNeedView } from './training/ClientTrainingNeedView';
import { TNI_REQUESTS_SEED, TniRequest } from './data/clientTrainingNeedData';
import { ClientMandatoryLearningView } from './learning/ClientMandatoryLearningView';
import { MANDATORY_COURSES_SEED } from './data/clientMandatoryLearningData';
import { BillingDetails, billableStaffOf, billingActionItemsOf, billingSeedFor, unmappedStaffIds } from './data/clientBillingData';
import type { TimesheetRange } from './data/clientTimesheetsData';
import { DIRECTORY_POC_SEED, DIRECTORY_PRIMARY_SEED } from './data/clientDirectoryData';
import {
  CLIENT_FEED_SEED,
  CLIENT_FEED_TABS,
  CLIENT_IMPORTANT_UPDATES_SEED,
  ClientFeedPost,
  ClientFeedTab,
  ClientImportantUpdate,
  offshoreStaffFrom,
} from './data/clientDashboardData';
import type { UserRole } from '../../types/user';

/** Dashboard overlays (Important Updates opens when the app opens) */
type ClientOverlay = 'updates' | 'services' | 'news' | 'manager' | 'role' | null;

/** Drawer modules that open a bottom-nav tab instead of a "more" screen */
const MODULE_TO_TAB: Record<string, Exclude<ClientTab, 'more'>> = {
  dashboard: 'home',
  'my-staff': 'staff',
  attendance: 'approvals',
  timesheets: 'timesheets',
  invoices: 'invoices',
};
const TAB_TO_MODULE: Record<Exclude<ClientTab, 'more'>, string> = {
  home: 'dashboard',
  staff: 'my-staff',
  approvals: 'attendance',
  timesheets: 'timesheets',
  invoices: 'invoices',
};

/** Where Back returns to after a cross-module link (restores the profile tab, invoice or hiring filter that was open) */
interface BackTarget {
  moduleId: string;
  staffFocus?: { staffId: string; tab?: StaffProfileTab };
  invoiceNo?: string;
  hiringProfile?: string | null;
  notifications?: boolean;
}

/** Mock load time of the dashboard when the app opens */
const DASHBOARD_LOAD_MS = 700;

/** Drawer / link items that open a sheet over the current screen instead of a module screen */
const OVERLAY_MODULES = ['other-modules', 'news-insights', 'account-manager'];

/**
 * Important Updates for this sign-in: auto-opens until closed once (Skip / Mark As Read / ✕), so later visits to the Client tab
 * don't reopen it. Mark As Read lasts across sign-ins; Skip shows them again after the next sign in (desktop).
 */
const updatesSession = { dismissed: false, read: false };

/**
 * Client (HRMS) experience — completely separate from the Staff / Manager app:
 * no shared screens, navigation or data. Screens are added here as they're specified.
 */
interface ClientAppProps {
  onLogout: () => void;
  /** Prototype: switch to the Staff / Manager app from the side menu */
  onSwitchRole?: (role: UserRole) => void;
}

export const ClientApp: React.FC<ClientAppProps> = ({ onLogout, onSwitchRole }) => {
  // Signed-in client (User Profile); name + photo show in the header, drawer and greetings
  const [profile, setProfile] = useState<ClientUserProfile>(CLIENT_USER_PROFILE_SEED);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const userName = `${profile.firstName} ${profile.lastName}`;

  // Signed-in client's firm (Company Profile); name shows in the drawer and module headers
  const [company, setCompany] = useState<ClientCompanyProfile>(CLIENT_COMPANY_PROFILE_SEED);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const companyName = company.companyName;

  // Client Contacts (Account)
  const [contacts, setContacts] = useState<ClientContact[]>(CLIENT_CONTACTS_SEED);

  // App shell (Dashboard + modules)
  const [tab, setTab] = useState<ClientTab>('home');
  const [moreModuleId, setMoreModuleId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Bumped when the active bottom-nav tab is tapped again → that tab reopens on its main list
  const [tabResets, setTabResets] = useState(0);

  // Client Contact Role (prototype switch in the drawer footer); drives menus, no-access states and actions
  const [role, setRole] = useState<ClientContactRole>(CLIENT_CONTACT_ROLES[0]);
  const canList = (moduleId: string) => permissionFor(role, moduleId).list;

  // Dashboard data
  const [dashLoading, setDashLoading] = useState(true);
  const [posts, setPosts] = useState<ClientFeedPost[]>(CLIENT_FEED_SEED);
  const [seenTabs, setSeenTabs] = useState<ClientFeedTab[]>([CLIENT_FEED_TABS[0]]);
  const [updates, setUpdates] = useState<ClientImportantUpdate[]>(CLIENT_IMPORTANT_UPDATES_SEED);
  const [updatesRead, setUpdatesRead] = useState(updatesSession.read);

  // Skip keeps Important Updates for the next visit; Mark As Read clears them
  const [overlay, setOverlay] = useState<ClientOverlay>(() => (updatesSession.dismissed || updatesSession.read ? null : 'updates'));
  // Service the Services You May Need tile asked the sheet to scroll to
  const [servicesFocus, setServicesFocus] = useState<string | null>(null);
  const closeUpdates = () => {
    updatesSession.dismissed = true;
    setOverlay(null);
  };

  // One inbox for every Client Hub module (bell in the header)
  const [notifications, setNotifications] = useState<ClientNotification[]>(CLIENT_NOTIFICATIONS_SEED);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // My Staff: the seed list plus candidates hired in Shortlisted Candidates (every staff-based module reads this list)
  const [staff, setStaff] = useState<ClientStaffMember[]>(MY_STAFF_SEED);
  // Opens a staff profile straight away (notification -> My Staff), optionally on a tab
  const [staffFocus, setStaffFocus] = useState<{ staffId: string; tab?: StaffProfileTab } | null>(null);
  // Staff Details › Reporting To / SOP changes per staff id (kept after Back and module switches)
  const [staffEdits, setStaffEdits] = useState<Record<string, StaffProfileEdits>>({});
  const offshoreStaff = useMemo(() => offshoreStaffFrom(staff), [staff]);
  const workFlexStaff = useMemo(() => workFlexStaffFrom(staff), [staff]);

  // Attendance Management > Attendance Amend (requests staff raise; the notification follows it and opens that tab)
  const [amends, setAmends] = useState<AmendRequest[]>(AMEND_SEED);
  const [amendFocus, setAmendFocus] = useState(false);

  // Staff Work Flexibility (kept while switching modules, like desktop's saved preferences)
  const [workFlex, setWorkFlex] = useState<WorkFlexPreferences>(WORK_FLEX_SEED);
  const workModeOf = useCallback((id: string) => workModeFromPrefs(workFlex, id), [workFlex]);

  // Reports › Timesheets opened from a My Staff card (desktop `task=report&id=`) or an invoice staff row (+ invoice period)
  const [timesheetPreset, setTimesheetPreset] = useState<{ staffIds: string[]; range?: TimesheetRange }>({ staffIds: [] });

  // Billing Details (payment methods + staff mapping; kept while switching modules)
  const [billing, setBilling] = useState<BillingDetails>(() => billingSeedFor(MY_STAFF_SEED));
  // Dashboard "Action Required": expired / expiring cards (follows Billing Details, so deleting or adding a card updates it)
  const billingActionItems = canList('billing-details') ? billingActionItemsOf(billing) : undefined;
  // Staff without a payment method in the last submitted mapping (new hires join this list)
  const unmappedBillingNames = useMemo(
    () =>
      unmappedStaffIds({ ...billing, mappings: billing.submittedMappings }, billableStaffOf(staff).map((s) => s.id)).map(
        (id) => staff.find((s) => s.id === id)?.name ?? id,
      ),
    [billing, staff],
  );

  // Only notifications for modules the role can open; the payment-method reminder follows Billing Details
  const visibleNotifications = notifications
    .filter((n) => !n.link || n.link === 'updates' || canList(n.link))
    .map((n) => {
      if (n.id !== 'cn-15') return n;
      const left = unmappedBillingNames.length;
      if (left === 0) return { ...n, read: true, actionRequired: false, title: 'Every staff member has a payment method' };
      const names = left > 1 ? `${unmappedBillingNames.slice(0, -1).join(', ')} and ${unmappedBillingNames[left - 1]}` : unmappedBillingNames[0];
      return {
        ...n,
        title: `${left} staff need a payment method`,
        body: `${names} ${left === 1 ? "isn't" : "aren't"} mapped to a bank account, card or Direct Pay yet. Map them in Billing Details.`,
      };
    });
  const unreadNotifications = visibleNotifications.filter((n) => !n.read).length;

  // Invoice opened from a notification (Invoice Details)
  const [invoiceFocus, setInvoiceFocus] = useState<string | null>(null);

  // Screens left by a link inside a module (or a notification); Back reopens the last one instead of the Dashboard
  const [backStack, setBackStack] = useState<BackTarget[]>([]);

  // Hire New Staff › Shortlisted Candidates (interviews, feedback and assessments; kept while switching modules)
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>(SHORTLISTED_SEED);

  // Hire New Staff › Talent Marketplace: Saved Resumes (profile ids); Request to Hire adds a row to Shortlisted Candidates (newest first)
  const [hubSaved, setHubSaved] = useState<string[]>(HUB_SAVED_SEED);
  // Talent Marketplace Compare selection (desktop keeps it for the session)
  const [marketplaceCompare, setMarketplaceCompare] = useState<string[]>([]);
  // Dashboard › Previously Saved Profiles: Saved Resumes newest first (requested ones leave the marketplace, like its Saved Resumes view)
  const savedHubProfiles = useMemo(
    () =>
      [...hubSaved]
        .reverse()
        .flatMap((id) => HUB_PROFILES_SEED.filter((p) => p.id === id && !candidates.some((c) => c.resumeId === p.resumeId))),
    [hubSaved, candidates],
  );
  // Opened from that section: Saved Resumes tab, optionally straight on one resume
  const [hubEntry, setHubEntry] = useState<{ resumeId?: string } | null>(null);
  // Dashboard › Shortlisted Candidates: candidate opened straight on its resume / CV
  const [interviewEntry, setInterviewEntry] = useState<string | null>(null);

  // Hire New Staff › Staff Requirements (created, edited and commented; kept while switching modules)
  const [requirements, setRequirements] = useState<StaffRequirement[]>(REQUIREMENTS_SEED);
  // Requirement row link → Talent Marketplace / Shortlisted Candidates filtered to its profile
  const [hiringProfile, setHiringProfile] = useState<string | null>(null);
  // Dashboard › Staff Requirement: requirement opened straight on View Requirement, or Add Requirement
  const [requirementEntry, setRequirementEntry] = useState<{ id?: string; add?: boolean } | null>(null);

  // Learning & Development › Training Need Identification (TNI requests and their notes; kept while switching modules)
  const [tniRequests, setTniRequests] = useState<TniRequest[]>(TNI_REQUESTS_SEED);

  // Feedback & Evaluation surveys (answers autosave like desktop, kept while switching modules)
  const [surveys, setSurveys] = useState<ClientSurvey[]>(FEEDBACK_SURVEYS_SEED);

  // Actions in one module leave a note in the shared inbox (newest first)
  const pushNotification = (n: Pick<ClientNotification, 'category' | 'title' | 'body' | 'link'> & Partial<ClientNotification>) =>
    setNotifications((prev) => [{ id: `cn-new-${Date.now()}-${prev.length}`, createdAt: new Date().toISOString(), read: false, ...n }, ...prev]);

  const HIRE_NAMES = ['Ritika Shah', 'Jaydeep Parmar', 'Meera Desai', 'Harsh Vyas', 'Pooja Rathod', 'Chirag Solanki'];

  // A decided "Hired" interview result joins the candidate to My Staff; "Resume RS-..." becomes the staff name (desktop)
  const updateCandidate = (id: string, patch: Partial<ShortlistedCandidate>) => {
    const before = candidates.find((c) => c.id === id);
    const hiring = patch.status === 'Hired' && before && before.status !== 'Hired' && !staff.some((s) => s.sourceCandidateId === id);
    let applied = patch;
    if (hiring && before) {
      const hiredCount = staff.filter((s) => s.sourceCandidateId).length;
      const name = before.name.startsWith('Resume ') ? HIRE_NAMES[hiredCount % HIRE_NAMES.length] : before.name;
      const level = Number((before.resume?.level ?? '').replace(/\D/g, '')) || 2;
      const member = staffFromHire(staff, { candidateId: id, name, designation: before.profile, level, joiningDate: isoOfDate(new Date()) });
      setStaff((prev) => [...prev, member]);
      applied = { ...patch, name };
      pushNotification({
        category: 'My Staff',
        title: `${name} joins your team`,
        body: `Hired as ${before.profile} (Level ${level}). Map a payment method in Billing Details before the next invoice.`,
        link: 'my-staff',
        targetId: member.id,
        actionRequired: true,
      });
    }
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, ...applied } : c)));
  };

  const decideAmends = (ids: string[], status: Exclude<AmendStatus, 'Pending'>, comment: string, setOffDate: string | null) => {
    const next = amends.map((r) =>
      ids.includes(r.id)
        ? { ...r, status, decidedOn: isoOfDate(new Date()), clientComment: comment, setOffDate: r.reason === SET_OFF_REASON ? setOffDate : null }
        : r,
    );
    setAmends(next);
    const left = pendingAmendCount(next);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id !== 'cn-1'
          ? n
          : left === 0
            ? { ...n, read: true, actionRequired: false, title: 'All attendance amend requests handled' }
            : { ...n, title: `${left} attendance amend request${left === 1 ? '' : 's'} awaiting approval` },
      ),
    );
  };

  const changeTni = (next: TniRequest[]) => {
    const added = next.length - tniRequests.length;
    if (added > 0) {
      const names = next.slice(0, added).map((r) => staff.find((s) => s.id === r.staffId)?.name ?? 'staff');
      pushNotification({
        category: 'Learning',
        title: `TNI request sent for ${names.length > 1 ? `${names.length} staff` : names[0]}`,
        body: 'The L&D team will assign the training and update the status here. You can message them from Notes.',
        link: 'training-need',
      });
    }
    setTniRequests(next);
  };

  const changeRequirements = (next: StaffRequirement[]) => {
    if (next.length > requirements.length) {
      pushNotification({
        category: 'Hiring',
        title: 'Staff requirement submitted',
        body: `${next[0].profile} (${next[0].level}) is with your account manager. Matching resumes will appear in the Talent Marketplace.`,
        link: 'requirements',
      });
    }
    setRequirements(next);
  };

  useEffect(() => {
    if (!dashLoading) return;
    const t = setTimeout(() => setDashLoading(false), DASHBOARD_LOAD_MS);
    return () => clearTimeout(t);
  }, [dashLoading]);

  const openTab = (next: ClientTab) => {
    setBackStack([]);
    setStaffFocus(null);
    setIsNotificationsOpen(false);
    setInvoiceFocus(null);
    setAmendFocus(false);
    setTimesheetPreset({ staffIds: [] });
    setTab(next);
    setMoreModuleId(null);
  };

  const openModule = (id: string) => {
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
    setOverlay(null);
    setTimesheetPreset({ staffIds: [] });
    setInvoiceFocus(null);
    setStaffFocus(null);
    setAmendFocus(false);
    setHiringProfile(null);
    setHubEntry(null);
    setInterviewEntry(null);
    setRequirementEntry(null);
    if (id === 'other-modules') return openServices();
    if (id === 'news-insights') return setOverlay('news');
    if (id === 'account-manager') return setOverlay('manager');
    setBackStack([]);
    const mapped = MODULE_TO_TAB[id];
    if (mapped) return openTab(mapped);
    setTab('more');
    setMoreModuleId(id);
  };

  // Staff Requirement / Pricing links: Talent Marketplace or Shortlisted Candidates filtered to one profile
  const openHiring = (id: 'staff-hub' | 'interviews', profile?: string) =>
    openFrom(here(), () => {
      openModule(id);
      setHiringProfile(profile ?? null);
    });

  const goHome = () => openTab('home');

  // The current screen as a Back target
  const here = (extra?: Partial<BackTarget>): BackTarget => ({ moduleId: currentModuleId, hiringProfile, ...extra });

  // Opens another module from inside this one; its Back returns here
  const openFrom = (from: BackTarget, open: () => void) => {
    const stack = [...backStack, from];
    open();
    setBackStack(stack);
  };

  const goBack = () => {
    const target = backStack[backStack.length - 1];
    if (!target) return goHome();
    const rest = backStack.slice(0, -1);
    openModule(target.moduleId);
    setBackStack(rest);
    if (target.staffFocus) setStaffFocus(target.staffFocus);
    if (target.invoiceNo) setInvoiceFocus(target.invoiceNo);
    if (target.hiringProfile) setHiringProfile(target.hiringProfile);
    if (target.notifications) setIsNotificationsOpen(true);
  };

  const closeOverlay = () => setOverlay(null);

  const openServices = (focusId?: string) => {
    setServicesFocus(focusId ?? null);
    setOverlay('services');
  };

  const markUpdatesRead = () => {
    updatesSession.read = true;
    setUpdatesRead(true);
    setNotifications((prev) => prev.map((n) => (n.link === 'updates' ? { ...n, read: true } : n)));
  };

  const openNotification = (n: ClientNotification) => {
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (!n.link) return;
    setIsNotificationsOpen(false);
    if (n.link === 'updates') {
      setOverlay('updates');
      return;
    }
    const link = n.link;
    // Sheets (e.g. Account Manager) open over the current screen, so there is nothing to come back to
    if (OVERLAY_MODULES.includes(link)) return openModule(link);
    openFrom(here({ notifications: true }), () => openModule(link));
    if (n.link === 'invoices' && n.targetId) setInvoiceFocus(n.targetId);
    if (n.link === 'attendance' && n.targetTab === 'amend') setAmendFocus(true);
    if (n.link === 'my-staff' && n.targetId) setStaffFocus({ staffId: n.targetId, tab: n.targetTab as StaffProfileTab | undefined });
  };

  const currentModuleId = tab === 'more' ? moreModuleId ?? '' : TAB_TO_MODULE[tab];
  const screenTitle =
    tab === 'more' ? findClientModule(moreModuleId ?? '')?.label ?? 'Module' : CLIENT_TAB_LABEL[tab];

  return (
    <ClientPermissionProvider role={role}>
    <DropdownSheetModeProvider value>
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden" aria-label="Client (HRMS)">
      <AppHeader
        fullName={userName}
        profilePhoto={profilePhoto}
        unreadNotifications={unreadNotifications}
        onOpenNotifications={() => {
          setIsMenuOpen(false);
          setOverlay(null);
          setIsNotificationsOpen(true);
        }}
        onOpenMenu={() => setIsMenuOpen(true)}
        onGoHome={() => openTab('home')}
        onOpenProfile={() => openModule('user-profile')}
      />
      <ClientSideDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        fullName={userName}
        photoUrl={profilePhoto}
        subtitle={`${role.name} · ${companyName}`}
        activeModuleId={currentModuleId}
        version={APP_VERSION}
        onOpenModule={(m) => openModule(m.id)}
        onOpenProfile={() => openModule('user-profile')}
        onLogout={() => {
          setIsMenuOpen(false);
          // Skipped Important Updates show again after the next sign in
          updatesSession.dismissed = false;
          onLogout();
        }}
        onSwitchRole={
          onSwitchRole &&
          ((r) => {
            setIsMenuOpen(false);
            onSwitchRole(r);
          })
        }
      />
      <div
        key={isNotificationsOpen ? 'notifications' : `${tab}-${moreModuleId ?? ''}-${tabResets}`}
        className="flex-1 min-h-0 flex flex-col overflow-hidden animate-in fade-in duration-200"
      >
        {isNotificationsOpen ? (
          <ClientNotificationsView
            notifications={visibleNotifications}
            onBack={() => setIsNotificationsOpen(false)}
            onOpen={openNotification}
            onMarkAllRead={() => {
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              markUpdatesRead();
            }}
          />
        ) : !canList(currentModuleId) ? (
          <ClientNoAccessView onBack={goBack} title={screenTitle} roleName={role.name} onGoHome={() => openTab('home')} />
        ) : tab === 'home' ? (
          <ClientDashboard
            userName={userName}
            posts={posts}
            staff={offshoreStaff}
            seenTabs={seenTabs}
            loading={dashLoading}
            onSeeTab={(t) => setSeenTabs((prev) => (prev.includes(t) ? prev : [...prev, t]))}
            onUpdatePost={(id, patch) => setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))}
            onHireNewStaff={canList('staff-hub') ? () => openModule('staff-hub') : undefined}
            onOpenMyStaff={canList('my-staff') ? () => openTab('staff') : undefined}
            utilizationMembers={canList('utilization') ? staff : undefined}
            actionItems={billingActionItems}
            onOpenBilling={billingActionItems ? () => openModule('billing-details') : undefined}
            onOpenServices={openServices}
            savedProfiles={canList('staff-hub') ? savedHubProfiles : undefined}
            onOpenSavedProfile={(resumeId) => {
              openModule('staff-hub');
              setHubEntry({ resumeId });
            }}
            onOpenSavedResumes={() => {
              openModule('staff-hub');
              setHubEntry({});
            }}
            shortlistedCandidates={canList('interviews') ? candidates : undefined}
            onOpenCandidate={
              permissionFor(role, 'interviews').view
                ? (id) => {
                    openModule('interviews');
                    setInterviewEntry(id);
                  }
                : undefined
            }
            onOpenShortlisted={() => openModule('interviews')}
            requirements={canList('requirements') ? requirements : undefined}
            requirementHub={HUB_PROFILES_SEED}
            requirementCandidates={candidates}
            onOpenRequirement={
              permissionFor(role, 'requirements').view
                ? (id) => {
                    openModule('requirements');
                    setRequirementEntry({ id });
                  }
                : undefined
            }
            onOpenRequirements={() => openModule('requirements')}
            onAddRequirement={
              permissionFor(role, 'requirements').add
                ? () => {
                    openModule('requirements');
                    setRequirementEntry({ add: true });
                  }
                : undefined
            }
          />
        ) : tab === 'staff' ? (
          <ClientMyStaffView
            onBack={goBack}
            staff={staff}
            clientName={userName}
            focus={staffFocus}
            amends={amends}
            staffEdits={staffEdits}
            onStaffEdit={(staffId, patch) => setStaffEdits((prev) => ({ ...prev, [staffId]: { ...prev[staffId], ...patch } }))}
            tniRequests={tniRequests}
            onOpenTrainingNeed={
              canList('training-need')
                ? (staffId) => openFrom(here({ staffFocus: { staffId, tab: 'Training & Development' } }), () => openModule('training-need'))
                : undefined
            }
            workModeOf={(id) => workModeFromPrefs(workFlex, id)}
            onOpenTimesheets={
              canList('timesheets')
                ? (m) =>
                    openFrom(here(), () => {
                      openModule('timesheets');
                      setTimesheetPreset({ staffIds: [m.id] });
                    })
                : undefined
            }
          />
        ) : tab === 'more' && moreModuleId === 'user-profile' ? (
          <ClientUserProfileView
            onBack={goBack}
            profile={profile}
            photoUrl={profilePhoto}
            companyName={companyName}
            onSave={setProfile}
            onPhotoChange={setProfilePhoto}
            onContactManager={() => openModule('account-manager')}
          />
        ) : tab === 'more' && moreModuleId === 'company-profile' ? (
          <ClientCompanyProfileView
            onBack={goBack}
            profile={company}
            logoUrl={companyLogo}
            agreements={CLIENT_AGREEMENTS_SEED}
            onSave={setCompany}
            onLogoChange={setCompanyLogo}
          />
        ) : tab === 'more' && moreModuleId === 'client-contacts' ? (
          <ClientContactsView
            onBack={backStack.length || !canList('company-profile') ? goBack : () => openModule('company-profile')}
            contacts={contacts}
            company={{
              address: company.address1,
              city: company.city,
              zipCode: company.zipCode,
              country: company.country,
              state: company.state,
              timeZone: company.timeZone,
            }}
            onChange={setContacts}
          />
        ) : tab === 'more' && moreModuleId === 'work-flexibility' ? (
          <ClientWorkFlexibilityView onBack={goBack} prefs={workFlex} staff={workFlexStaff} userName={userName} onChange={setWorkFlex} />
        ) : tab === 'more' && moreModuleId === 'mgmt-fee' ? (
          <ClientMgmtFeeView
            onBack={goBack}
            charts={MGMT_FEE_CHARTS}
            initialChartId="level-wise"
            onContactManager={() => openModule('account-manager')}
          />
        ) : tab === 'more' && moreModuleId === 'directories' ? (
          <ClientDirectoryView
            onBack={goBack}
            primaryContacts={DIRECTORY_PRIMARY_SEED}
            products={DIRECTORY_POC_SEED}
            onOpenAccountManager={() => openModule('account-manager')}
          />
        ) : tab === 'approvals' ? (
          <ClientAttendanceView
            onBack={goBack}
            requests={amends}
            staff={staff}
            onDecide={decideAmends}
            workModeOf={workModeOf}
            initialTab={amendFocus ? 'amend' : 'attendance'}
          />
        ) : tab === 'timesheets' ? (
          <ClientTimesheetsView onBack={goBack} staff={staff} initialStaffIds={timesheetPreset.staffIds} initialRange={timesheetPreset.range} />
        ) : tab === 'invoices' ? (
          <ClientInvoicesView
            onBack={goBack}
            staff={staff}
            initialInvoiceNo={invoiceFocus}
          />
        ) : tab === 'more' && moreModuleId === 'billing-details' ? (
          <ClientBillingDetailsView
            onBack={goBack}
            billing={billing}
            staff={staff}
            country={company.country}
            userName={userName}
            onChange={setBilling}
          />
        ) : tab === 'more' && moreModuleId === 'inclusions' ? (
          <ClientInclusionsView onBack={goBack} />
        ) : tab === 'more' && moreModuleId === 'staff-hub' ? (
          <ClientTalentMarketplaceView
            onBack={goBack}
            profiles={HUB_PROFILES_SEED}
            candidates={candidates}
            savedIds={hubSaved}
            onToggleSave={(id) => setHubSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
            compareIds={marketplaceCompare}
            onCompareChange={setMarketplaceCompare}
            onRequestToHire={(c) => {
              setCandidates((prev) => [c, ...prev]);
              pushNotification({
                category: 'Hiring',
                title: `${c.name} shortlisted`,
                body:
                  c.status === 'Interview Scheduled'
                    ? `${c.profile} · Interview scheduled. Join or reschedule it from Shortlisted Candidates.`
                    : `${c.profile} · Schedule an interview from Shortlisted Candidates.`,
                link: 'interviews',
              });
            }}
            onUpdateCandidate={updateCandidate}
            requirements={requirements}
            onCreateRequirements={(created) => changeRequirements([...created, ...requirements])}
            onOpenShortlisted={canList('interviews') ? () => openFrom(here(), () => openModule('interviews')) : undefined}
            onContactManager={() => openModule('account-manager')}
            initialProfile={hiringProfile}
            initialSaved={hubEntry !== null}
            initialProfileId={hubEntry?.resumeId}
          />
        ) : tab === 'more' && moreModuleId === 'requirements' ? (
          <ClientRequirementsView
            onBack={goBack}
            requirements={requirements}
            onChange={changeRequirements}
            userName={userName}
            hubProfiles={HUB_PROFILES_SEED}
            candidates={candidates}
            defaultLocations={OFFSHORE_LOCATIONS.filter((l) => staff.some((m) => m.location === l))}
            onOpenHub={canList('staff-hub') ? (profile) => openHiring('staff-hub', profile) : undefined}
            onOpenShortlisted={canList('interviews') ? (profile) => openHiring('interviews', profile) : undefined}
            initialRequirementId={requirementEntry?.id}
            initialAdd={requirementEntry?.add}
          />
        ) : tab === 'more' && moreModuleId === 'hiring-pricing' ? (
          <ClientHiringPricingView
            onBack={goBack}
            country={company.country}
            onCreateRequirements={canList('requirements') && permissionFor(role, 'requirements').add ? (created) => changeRequirements([...created, ...requirements]) : undefined}
            defaultLocations={OFFSHORE_LOCATIONS.filter((l) => staff.some((m) => m.location === l))}
            onOpenHub={canList('staff-hub') ? (profile) => openHiring('staff-hub', profile) : undefined}
          />
        ) : tab === 'more' && moreModuleId === 'interviews' ? (
          <ClientInterviewsView
            onBack={goBack}
            candidates={candidates}
            onUpdate={updateCandidate}
            onContactManager={() => openModule('account-manager')}
            initialProfile={hiringProfile}
            initialCandidateId={interviewEntry}
          />
        ) : tab === 'more' && moreModuleId === 'training-need' ? (
          <ClientTrainingNeedView onBack={goBack} requests={tniRequests} staff={staff} onChange={changeTni} />
        ) : tab === 'more' && moreModuleId === 'mandatory-learning' ? (
          <ClientMandatoryLearningView onBack={goBack} courses={MANDATORY_COURSES_SEED} staff={staff} />
        ) : tab === 'more' && moreModuleId === 'feedback-evaluation' ? (
          <ClientFeedbackView
            onBack={goBack}
            surveys={surveys}
            userName={userName}
            companyName={companyName}
            onUpdate={(id, patch) => setSurveys((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))}
          />
        ) : (
          <ComingSoonView title={screenTitle} onGoHome={goHome} onBack={goBack} />
        )}
      </div>
      {/* Hidden on Notifications, like Staff / Manager */}
      {!isNotificationsOpen && (
        <ClientAppBottomNav
          activeTab={tab}
          onTabChange={(next) => {
            setOverlay(null);
            if (next === tab) setTabResets((n) => n + 1);
            openTab(next);
          }}
        />
      )}

      <ClientImportantUpdatesSheet
        isOpen={overlay === 'updates'}
        updates={updates}
        allRead={updatesRead}
        onUpdate={(id, patch) => setUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))}
        onMarkAllRead={() => {
          markUpdatesRead();
          closeUpdates();
        }}
        onSkip={closeUpdates}
      />
      <ClientServicesSheet isOpen={overlay === 'services'} focusId={servicesFocus} onClose={closeOverlay} />
      <ClientNewsInsightsSheet isOpen={overlay === 'news'} onClose={closeOverlay} />
      <ClientAccountManagerSheet isOpen={overlay === 'manager'} onClose={closeOverlay} />
      <ClientRoleSheet
        isOpen={overlay === 'role'}
        activeRoleId={role.id}
        onSelect={(r) => {
          setRole(r);
          closeOverlay();
        }}
        onClose={closeOverlay}
      />
    </div>
    </DropdownSheetModeProvider>
    </ClientPermissionProvider>
  );
};
