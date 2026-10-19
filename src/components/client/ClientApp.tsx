import React, { useEffect, useState } from 'react';
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
import { MY_STAFF_SEED } from './data/clientStaffData';
import { ClientWorkFlexibilityView } from './flexibility/ClientWorkFlexibilityView';
import { WORK_FLEX_SEED, WORK_FLEX_STAFF, WorkFlexPreferences } from './data/clientWorkFlexData';
import { ClientMgmtFeeView } from './fees/ClientMgmtFeeView';
import { MGMT_FEE_SEED, MGMT_FEE_STAFF_BY_LEVEL, MGMT_FEE_TEAM_SIZE } from './data/clientMgmtFeeData';
import { ClientFeedbackView } from './feedback/ClientFeedbackView';
import { ClientSurvey, FEEDBACK_SURVEYS_SEED } from './data/clientFeedbackData';
import { ClientNotificationsView } from './notifications/ClientNotificationsView';
import { ClientUserProfileView } from './profile/ClientUserProfileView';
import { CLIENT_USER_PROFILE_SEED, ClientUserProfile } from './data/clientUserProfileData';
import { ClientCompanyProfileView } from './profile/ClientCompanyProfileView';
import {
  CLIENT_AGREEMENTS_SEED,
  CLIENT_COMPANY_PROFILE_SEED,
  CLIENT_FIRM_CONTACTS_SEED,
  ClientCompanyProfile,
} from './data/clientCompanyProfileData';
import { CLIENT_NOTIFICATIONS_SEED, ClientNotification } from './data/clientNotificationsData';
import { ClientDirectoryView } from './directory/ClientDirectoryView';
import { ClientInterviewsView } from './interviews/ClientInterviewsView';
import { SHORTLISTED_SEED, ShortlistedCandidate } from './data/clientInterviewsData';
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
  OFFSHORE_STAFF_SEED,
} from './data/clientDashboardData';

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
export const ClientApp: React.FC = () => {
  // Signed-in client (User Profile); name + photo show in the header, drawer and greetings
  const [profile, setProfile] = useState<ClientUserProfile>(CLIENT_USER_PROFILE_SEED);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const userName = `${profile.firstName} ${profile.lastName}`;

  // Signed-in client's firm (Company Profile); name shows in the drawer and module headers
  const [company, setCompany] = useState<ClientCompanyProfile>(CLIENT_COMPANY_PROFILE_SEED);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const companyName = company.companyName;

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
  const updateCandidate = (id: string, patch: Partial<ShortlistedCandidate>) =>
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  // Hire New Staff › Available Staff Hub: Saved Resumes (profile ids); shortlisting adds a row to Shortlisted Candidates (newest first)
  const [hubSaved, setHubSaved] = useState<string[]>(HUB_SAVED_SEED);

  // Hire New Staff › Staff Requirements (created, edited and commented; kept while switching modules)
  const [requirements, setRequirements] = useState<StaffRequirement[]>(REQUIREMENTS_SEED);

  // Learning & Development › Training Need Identification (TNI requests and their notes; kept while switching modules)
  const [tniRequests, setTniRequests] = useState<TniRequest[]>(TNI_REQUESTS_SEED);

  // Feedback & Evaluation surveys (answers autosave like desktop, kept while switching modules)
  const [surveys, setSurveys] = useState<ClientSurvey[]>(FEEDBACK_SURVEYS_SEED);

  useEffect(() => {
    if (!dashLoading) return;
    const t = setTimeout(() => setDashLoading(false), DASHBOARD_LOAD_MS);
    return () => clearTimeout(t);
  }, [dashLoading]);

  const openTab = (next: ClientTab) => {
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
        onOpenRole={() => {
          setIsMenuOpen(false);
          setOverlay('role');
        }}
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
            staff={OFFSHORE_STAFF_SEED}
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
            staff={MY_STAFF_SEED}
            clientName={userName}
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
            contacts={CLIENT_FIRM_CONTACTS_SEED}
            onSave={setCompany}
            onLogoChange={setCompanyLogo}
            onOpenContacts={canList('client-contacts') ? () => openModule('client-contacts') : undefined}
            onContactManager={() => openModule('account-manager')}
          />
        ) : tab === 'more' && moreModuleId === 'work-flexibility' ? (
          <ClientWorkFlexibilityView prefs={workFlex} staff={WORK_FLEX_STAFF} userName={userName} onChange={setWorkFlex} />
        ) : tab === 'more' && moreModuleId === 'mgmt-fee' ? (
          <ClientMgmtFeeView
            structure={MGMT_FEE_SEED}
            teamSize={MGMT_FEE_TEAM_SIZE}
            staffByLevel={MGMT_FEE_STAFF_BY_LEVEL}
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
        ) : tab === 'timesheets' ? (
          <ClientTimesheetsView staff={MY_STAFF_SEED} initialStaffIds={timesheetPreset.staffIds} initialRange={timesheetPreset.range} />
        ) : tab === 'invoices' ? (
          <ClientInvoicesView
            staff={MY_STAFF_SEED}
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
            billingSummary={canList('billing-details') ? billingSummaryOf(billing, MY_STAFF_SEED) : undefined}
            onOpenBilling={canList('billing-details') ? () => openModule('billing-details') : undefined}
          />
        ) : tab === 'more' && moreModuleId === 'billing-details' ? (
          <ClientBillingDetailsView
            billing={billing}
            staff={MY_STAFF_SEED}
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
            onShortlist={(c) => setCandidates((prev) => [c, ...prev])}
            onUpdateCandidate={updateCandidate}
            onOpenShortlisted={canList('interviews') ? () => openModule('interviews') : undefined}
            onContactManager={() => openModule('account-manager')}
          />
        ) : tab === 'more' && moreModuleId === 'requirements' ? (
          <ClientRequirementsView
            requirements={requirements}
            onChange={setRequirements}
            userName={userName}
            hubProfiles={HUB_PROFILES_SEED}
            candidates={candidates}
            defaultLocations={OFFSHORE_LOCATIONS.filter((l) => MY_STAFF_SEED.some((m) => m.location === l))}
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
          <ClientTrainingNeedView requests={tniRequests} staff={MY_STAFF_SEED} onChange={setTniRequests} />
        ) : tab === 'more' && moreModuleId === 'mandatory-learning' ? (
          <ClientMandatoryLearningView courses={MANDATORY_COURSES_SEED} staff={MY_STAFF_SEED} />
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
