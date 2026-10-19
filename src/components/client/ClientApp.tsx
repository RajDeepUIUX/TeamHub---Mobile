import React, { useEffect, useMemo, useState } from 'react';
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
import { CURRENT_STAFF_STATUSES, ClientStaffMember, MY_STAFF_SEED, StaffProfileTab, staffFromHire } from './data/clientStaffData';
import { ClientAttendanceView } from './attendance/ClientAttendanceView';
import { AMEND_SEED, AmendRequest, AmendStatus, pendingAmendCount } from './data/clientAttendanceData';
import { ClientWorkFlexibilityView } from './flexibility/ClientWorkFlexibilityView';
import { WORK_FLEX_SEED, WorkFlexPreferences, workFlexStaffFrom, workModeFromPrefs } from './data/clientWorkFlexData';
import { ClientMgmtFeeView } from './fees/ClientMgmtFeeView';
import { MGMT_FEE_SEED } from './data/clientMgmtFeeData';
import { ClientFeedbackView } from './feedback/ClientFeedbackView';
import { ClientSurvey, FEEDBACK_SURVEYS_SEED } from './data/clientFeedbackData';
import { ClientNotificationsView } from './notifications/ClientNotificationsView';
import { ClientUserProfileView } from './profile/ClientUserProfileView';
import { CLIENT_USER_PROFILE_SEED, ClientUserProfile } from './data/clientUserProfileData';
import { ClientCompanyProfileView } from './profile/ClientCompanyProfileView';
import { CLIENT_AGREEMENTS_SEED, CLIENT_COMPANY_PROFILE_SEED, ClientCompanyProfile } from './data/clientCompanyProfileData';
import { ClientContactsView } from './contacts/ClientContactsView';
import { CLIENT_CONTACTS_SEED, ClientContact, firmContactOf } from './data/clientContactsData';
import { CLIENT_NOTIFICATIONS_SEED, ClientNotification } from './data/clientNotificationsData';
import { ClientDirectoryView } from './directory/ClientDirectoryView';
import { ClientInterviewsView } from './interviews/ClientInterviewsView';
import { SHORTLISTED_SEED, ShortlistedCandidate, isoOfDate } from './data/clientInterviewsData';
import { ClientStaffHubView } from './hub/ClientStaffHubView';
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
import { BillingDetails, billingSeedFor, billingSummaryOf } from './data/clientBillingData';
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

/** Mock load time of the dashboard when the app opens */
const DASHBOARD_LOAD_MS = 700;

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

  // Client Contacts (Account); Company Profile's Contact Persons list reads the same data
  const [contacts, setContacts] = useState<ClientContact[]>(CLIENT_CONTACTS_SEED);
  const firmContacts = useMemo(() => contacts.map(firmContactOf), [contacts]);

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
  const [updatesRead, setUpdatesRead] = useState(false);
  const unreadUpdates = updatesRead ? 0 : updates.length;

  // Skip keeps Important Updates for the next visit; Mark As Read clears them
  const [overlay, setOverlay] = useState<ClientOverlay>('updates');

  // One inbox for every Client Hub module (bell in the header)
  const [notifications, setNotifications] = useState<ClientNotification[]>(CLIENT_NOTIFICATIONS_SEED);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // Only notifications for modules the role can open
  const visibleNotifications = notifications.filter((n) => !n.link || n.link === 'updates' || canList(n.link));
  const unreadNotifications = visibleNotifications.filter((n) => !n.read).length;

  // My Staff: the seed list plus candidates hired in Shortlisted Candidates (every staff-based module reads this list)
  const [staff, setStaff] = useState<ClientStaffMember[]>(MY_STAFF_SEED);
  // Opens a staff profile straight away (notification -> My Staff), optionally on a tab
  const [staffFocus, setStaffFocus] = useState<{ staffId: string; tab?: StaffProfileTab } | null>(null);
  const offshoreStaff = useMemo(() => offshoreStaffFrom(staff), [staff]);
  const workFlexStaff = useMemo(() => workFlexStaffFrom(staff), [staff]);
  const currentStaff = useMemo(() => staff.filter((s) => CURRENT_STAFF_STATUSES.includes(s.status)), [staff]);
  const staffByLevel = useMemo(
    () =>
      currentStaff.reduce<Record<number, number>>((acc, s) => {
        const n = Number(s.level.replace(/\D/g, ''));
        acc[n] = (acc[n] ?? 0) + 1;
        return acc;
      }, {}),
    [currentStaff],
  );

  // Attendance Management > Attendance Amend (requests staff raise; the notification follows it)
  const [amends, setAmends] = useState<AmendRequest[]>(AMEND_SEED);

  // Staff Work Flexibility (kept while switching modules, like desktop's saved preferences)
  const [workFlex, setWorkFlex] = useState<WorkFlexPreferences>(WORK_FLEX_SEED);

  // Reports › Timesheets opened from a My Staff card (desktop `task=report&id=`) or an invoice staff row (+ invoice period)
  const [timesheetPreset, setTimesheetPreset] = useState<{ staffIds: string[]; range?: TimesheetRange }>({ staffIds: [] });

  // Billing Details (payment methods + staff mapping; kept while switching modules)
  const [billing, setBilling] = useState<BillingDetails>(() => billingSeedFor(MY_STAFF_SEED));

  // Invoice opened from a notification (Invoice Details)
  const [invoiceFocus, setInvoiceFocus] = useState<string | null>(null);

  // Hire New Staff › Shortlisted Candidates (interviews, feedback and assessments; kept while switching modules)
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>(SHORTLISTED_SEED);

  // Hire New Staff › Available Staff Hub: Saved Resumes (profile ids); shortlisting adds a row to Shortlisted Candidates (newest first)
  const [hubSaved, setHubSaved] = useState<string[]>(HUB_SAVED_SEED);

  // Hire New Staff › Staff Requirements (created, edited and commented; kept while switching modules)
  const [requirements, setRequirements] = useState<StaffRequirement[]>(REQUIREMENTS_SEED);

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
    const next = amends.map((r) => (ids.includes(r.id) ? { ...r, status, decidedOn: isoOfDate(new Date()), clientComment: comment, setOffDate } : r));
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
        body: `${next[0].profile} (${next[0].level}) is with your account manager. Matching resumes will appear in the Available Staff Hub.`,
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
    setStaffFocus(null);
    setIsNotificationsOpen(false);
    setInvoiceFocus(null);
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
    if (id === 'other-modules') return setOverlay('services');
    if (id === 'news-insights') return setOverlay('news');
    if (id === 'account-manager') return setOverlay('manager');
    const mapped = MODULE_TO_TAB[id];
    if (mapped) return openTab(mapped);
    setTab('more');
    setMoreModuleId(id);
  };

  const closeOverlay = () => setOverlay(null);

  const markUpdatesRead = () => {
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
    openModule(n.link);
    if (n.link === 'invoices' && n.targetId) setInvoiceFocus(n.targetId);
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
              setUpdatesRead(true);
            }}
          />
        ) : !canList(currentModuleId) ? (
          <ClientNoAccessView title={screenTitle} roleName={role.name} onGoHome={() => openTab('home')} />
        ) : tab === 'home' ? (
          <ClientDashboard
            userName={userName}
            posts={posts}
            staff={offshoreStaff}
            unreadUpdates={unreadUpdates}
            seenTabs={seenTabs}
            loading={dashLoading}
            onSeeTab={(t) => setSeenTabs((prev) => (prev.includes(t) ? prev : [...prev, t]))}
            onUpdatePost={(id, patch) => setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))}
            onOpenUpdates={() => setOverlay('updates')}
            onHireNewStaff={canList('staff-hub') ? () => openModule('staff-hub') : undefined}
            onOpenMyStaff={canList('my-staff') ? () => openTab('staff') : undefined}
          />
        ) : tab === 'staff' ? (
          <ClientMyStaffView
            staff={staff}
            clientName={userName}
            focus={staffFocus}
            tniRequests={tniRequests}
            onOpenTrainingNeed={canList('training-need') ? () => openModule('training-need') : undefined}
            workModeOf={(id) => workModeFromPrefs(workFlex, id)}
            onOpenTimesheets={
              canList('timesheets')
                ? (m) => {
                    openModule('timesheets');
                    setTimesheetPreset({ staffIds: [m.id] });
                  }
                : undefined
            }
          />
        ) : tab === 'more' && moreModuleId === 'user-profile' ? (
          <ClientUserProfileView
            profile={profile}
            photoUrl={profilePhoto}
            companyName={companyName}
            onSave={setProfile}
            onPhotoChange={setProfilePhoto}
            onContactManager={() => openModule('account-manager')}
          />
        ) : tab === 'more' && moreModuleId === 'company-profile' ? (
          <ClientCompanyProfileView
            profile={company}
            logoUrl={companyLogo}
            agreements={CLIENT_AGREEMENTS_SEED}
            contacts={firmContacts}
            onSave={setCompany}
            onLogoChange={setCompanyLogo}
            onOpenContacts={canList('client-contacts') ? () => openModule('client-contacts') : undefined}
            onContactManager={() => openModule('account-manager')}
          />
        ) : tab === 'more' && moreModuleId === 'client-contacts' ? (
          <ClientContactsView
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
          <ClientWorkFlexibilityView prefs={workFlex} staff={workFlexStaff} userName={userName} onChange={setWorkFlex} />
        ) : tab === 'more' && moreModuleId === 'mgmt-fee' ? (
          <ClientMgmtFeeView
            structure={MGMT_FEE_SEED}
            teamSize={currentStaff.length}
            staffByLevel={staffByLevel}
            companyName={companyName}
            onContactManager={() => openModule('account-manager')}
            onOpenMyStaff={canList('my-staff') ? () => openTab('staff') : undefined}
          />
        ) : tab === 'more' && moreModuleId === 'directories' ? (
          <ClientDirectoryView
            primaryContacts={DIRECTORY_PRIMARY_SEED}
            products={DIRECTORY_POC_SEED}
            onOpenAccountManager={() => openModule('account-manager')}
          />
        ) : tab === 'approvals' ? (
          <ClientAttendanceView
            requests={amends}
            staff={staff}
            onDecide={decideAmends}
            onOpenMyStaff={canList('my-staff') ? () => openTab('staff') : undefined}
          />
        ) : tab === 'timesheets' ? (
          <ClientTimesheetsView staff={staff} initialStaffIds={timesheetPreset.staffIds} initialRange={timesheetPreset.range} />
        ) : tab === 'invoices' ? (
          <ClientInvoicesView
            staff={staff}
            initialInvoiceNo={invoiceFocus}
            onOpenTimesheets={
              canList('timesheets')
                ? (staffIds, range) => {
                    openModule('timesheets');
                    setTimesheetPreset({ staffIds, range });
                  }
                : undefined
            }
            onContactManager={() => openModule('account-manager')}
            billingSummary={canList('billing-details') ? billingSummaryOf(billing, staff) : undefined}
            onOpenBilling={canList('billing-details') ? () => openModule('billing-details') : undefined}
          />
        ) : tab === 'more' && moreModuleId === 'billing-details' ? (
          <ClientBillingDetailsView
            billing={billing}
            staff={staff}
            country={company.country}
            userName={userName}
            onChange={setBilling}
            onOpenInvoices={canList('invoices') ? () => openTab('invoices') : undefined}
          />
        ) : tab === 'more' && moreModuleId === 'inclusions' ? (
          <ClientInclusionsView companyName={companyName} onContactManager={() => openModule('account-manager')} />
        ) : tab === 'more' && moreModuleId === 'staff-hub' ? (
          <ClientStaffHubView
            profiles={HUB_PROFILES_SEED}
            candidates={candidates}
            savedIds={hubSaved}
            onToggleSave={(id) => setHubSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
            onShortlist={(c) => {
              setCandidates((prev) => [c, ...prev]);
              pushNotification({
                category: 'Hiring',
                title: `${c.name} shortlisted`,
                body: `${c.profile} · Schedule an interview from Shortlisted Candidates.`,
                link: 'interviews',
              });
            }}
            onUpdateCandidate={updateCandidate}
            onOpenShortlisted={canList('interviews') ? () => openModule('interviews') : undefined}
            onContactManager={() => openModule('account-manager')}
          />
        ) : tab === 'more' && moreModuleId === 'requirements' ? (
          <ClientRequirementsView
            requirements={requirements}
            onChange={changeRequirements}
            userName={userName}
            hubProfiles={HUB_PROFILES_SEED}
            candidates={candidates}
            defaultLocations={OFFSHORE_LOCATIONS.filter((l) => staff.some((m) => m.location === l))}
            onOpenHub={canList('staff-hub') ? () => openModule('staff-hub') : undefined}
            onOpenShortlisted={canList('interviews') ? () => openModule('interviews') : undefined}
          />
        ) : tab === 'more' && moreModuleId === 'hiring-pricing' ? (
          <ClientHiringPricingView
            companyName={companyName}
            country={company.country}
            onContactManager={() => openModule('account-manager')}
            onAddRequirement={canList('requirements') && permissionFor(role, 'requirements').add ? () => openModule('requirements') : undefined}
          />
        ) : tab === 'more' && moreModuleId === 'interviews' ? (
          <ClientInterviewsView
            candidates={candidates}
            onUpdate={updateCandidate}
            onContactManager={() => openModule('account-manager')}
          />
        ) : tab === 'more' && moreModuleId === 'training-need' ? (
          <ClientTrainingNeedView requests={tniRequests} staff={staff} onChange={changeTni} />
        ) : tab === 'more' && moreModuleId === 'mandatory-learning' ? (
          <ClientMandatoryLearningView courses={MANDATORY_COURSES_SEED} staff={staff} />
        ) : tab === 'more' && moreModuleId === 'feedback-evaluation' ? (
          <ClientFeedbackView
            surveys={surveys}
            userName={userName}
            companyName={companyName}
            onUpdate={(id, patch) => setSurveys((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))}
          />
        ) : (
          <ComingSoonView title={screenTitle} onGoHome={() => openTab('home')} />
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
          closeOverlay();
        }}
        onSkip={closeOverlay}
      />
      <ClientServicesSheet isOpen={overlay === 'services'} onClose={closeOverlay} />
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
