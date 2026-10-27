import type React from 'react';
import {
  LayoutDashboard,
  UsersRound,
  Users,
  CalendarCheck,
  Luggage,
  CalendarDays,
  ListTodo,
  BadgeCheck,
  FolderOpen,
  Video,
  ScrollText,
  Shuffle,
  Contact,
  UserPlus,
  Store,
  ClipboardList,
  MessagesSquare,
  Tag,
  Timer,
  GraduationCap,
  BookOpen,
  BookMarked,
  MessageSquareHeart,
  Target,
  TrendingDown,
  ClipboardCheck,
  BarChart3,
  ReceiptText,
  Wallet,
  Coins,
  Landmark,
  Gauge,
  CalendarRange,
  NotebookPen,
  MonitorCheck,
  Library,
  FolderKanban,
  HelpCircle,
  Megaphone,
  CircleDot,
  ListChecks,
  Gift,
  LayoutGrid,
  Headset,
  UserRound,
  Building2,
  ShieldCheck,
  Settings,
  PenLine,
  BookUser,
  Clock3,
  CreditCard,
  PackageCheck,
  ScanSearch,
  Newspaper,
} from 'lucide-react';

export interface ClientMenuModule {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  /** Mobile design is ready; only these show in the side menu */
  designed?: boolean;
}

export interface ClientMenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  modules: ClientMenuModule[];
}

/** Full Client portal menu (desktop sidebar groups; per-role visibility comes from Client Contact Roles) */
export const CLIENT_MENU_GROUPS: ClientMenuGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    modules: [{ id: 'dashboard', label: 'Dashboard', hint: "Offshore staff & what's happening around", icon: LayoutDashboard, designed: true }],
  },
  {
    id: 'company-profile',
    label: 'Company Profile',
    icon: Building2,
    modules: [{ id: 'company-profile', label: 'Company Profile', hint: 'Firm details & address', icon: Building2, designed: true }],
  },
  {
    id: 'directory',
    label: 'Directory',
    icon: BookUser,
    modules: [{ id: 'directories', label: 'Directory', hint: 'Primary contacts & product POCs', icon: BookUser, designed: true }],
  },
  {
    id: 'hr',
    label: 'Human Resources',
    icon: Users,
    modules: [
      { id: 'my-staff', label: 'My Staff', hint: 'Profiles, status & staff details', icon: UsersRound, designed: true },
      { id: 'attendance', label: 'Attendance Management', hint: 'Daily attendance & amend requests', icon: CalendarCheck, designed: true },
      { id: 'leaves', label: 'Leave Management', hint: 'Staff leaves & deductions', icon: Luggage },
      { id: 'holidays', label: 'Holidays', hint: 'Holiday calendar', icon: CalendarDays },
      { id: 'task-repository', label: 'Task Repository', hint: 'Create & assign tasks', icon: ListTodo },
      { id: 'staff-can-perform', label: 'Staff Can Perform', hint: 'Skills per staff', icon: BadgeCheck },
      { id: 'staff-documents', label: 'Staff Documents', hint: 'View & download documents', icon: FolderOpen },
      { id: 'meetings', label: 'Meetings', hint: 'Agenda, documents & comments', icon: Video },
      { id: 'policies', label: 'Policies & Guidelines', hint: 'Company policies', icon: ScrollText },
      { id: 'work-flexibility', label: 'Work Flexibility Preferences', hint: 'Hybrid / WFH & additional flexibilities', icon: Shuffle, designed: true },
      { id: 'mgmt-fee', label: 'Management Fee Structure', hint: 'MOS & other fee rates', icon: Landmark, designed: true },
      { id: 'inclusions', label: 'Inclusions', hint: 'What your engagement covers', icon: PackageCheck, designed: true },
      { id: 'performance', label: 'Performance Management', hint: 'Goals & feedback', icon: Target },
      { id: 'pip', label: 'PIP', hint: 'Performance improvement plans', icon: TrendingDown },
    ],
  },
  {
    id: 'hire',
    label: 'Hire New Staff',
    icon: UserPlus,
    modules: [
      { id: 'staff-hub', label: 'Talent Marketplace', hint: 'Browse talent & request to hire', icon: Store, designed: true },
      { id: 'requirements', label: 'Staff Requirements', hint: 'Create & track requirements', icon: ClipboardList, designed: true },
      { id: 'interviews', label: 'Shortlisted Candidates', hint: 'Candidates, interviews & feedback', icon: MessagesSquare, designed: true },
      { id: 'hiring-pricing', label: 'Pricing & Hiring', hint: 'Rates by level, hiring models & terms', icon: Tag, designed: true },
      { id: 'temp-staffing', label: 'Temp / Seasonal Staffing', hint: 'Seasonal requests & OT history', icon: Timer },
    ],
  },
  {
    id: 'learning',
    label: 'Learning & Development',
    icon: GraduationCap,
    modules: [
      { id: 'learnings', label: 'Learnings', hint: 'Staff progress & training requests', icon: BookOpen },
      { id: 'training-need', label: 'Training Need Identification', hint: 'TNI requests, status & notes', icon: ScanSearch, designed: true },
      { id: 'mandatory-learning', label: 'Mandatory Learning', hint: 'Course completion per staff', icon: BookMarked, designed: true },
    ],
  },
  {
    id: 'feedback',
    label: 'Feedback & Evaluation',
    icon: MessageSquareHeart,
    modules: [
      { id: 'feedback-evaluation', label: 'Feedback & Evaluation', hint: 'Service, staff & check-in surveys', icon: ClipboardCheck, designed: true },
    ],
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: ReceiptText,
    modules: [
      { id: 'invoices', label: 'Invoices', hint: 'Invoices, timesheet PDFs & exports', icon: ReceiptText, designed: true },
      { id: 'billing-details', label: 'Billing Details', hint: 'Payment methods & staff mapping', icon: CreditCard, designed: true },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    modules: [
      { id: 'timesheets', label: 'Timesheets', hint: 'Daily hours per staff & CSV exports', icon: Clock3, designed: true },
      { id: 'payroll-ledger', label: 'Payroll Ledger', hint: 'Payroll history', icon: Wallet },
      { id: 'compensation', label: 'Compensation', hint: 'Staff compensation', icon: Coins },
      { id: 'utilization', label: 'Staff Utilization Report', hint: 'Utilization buckets & activity', icon: Gauge },
      { id: 'leave-utilization', label: 'Leave Utilization Report', hint: 'Leaves & holidays used', icon: CalendarRange },
      { id: 'timesheet-notes', label: 'Timesheet Notes', hint: 'Activity notes & action items', icon: NotebookPen },
      { id: 'monitoring', label: 'Employee Monitoring', hint: 'Activity logs & time tracking', icon: MonitorCheck },
    ],
  },
  {
    id: 'resources',
    label: 'Resources & Community',
    icon: Library,
    modules: [
      { id: 'client-resources', label: 'Client Resources', hint: 'Onboarding & best practices', icon: FolderKanban },
      { id: 'faqs', label: 'FAQs', hint: 'Common questions', icon: HelpCircle },
      { id: 'monthly-updates', label: 'Monthly Updates', hint: 'Product & service updates', icon: Megaphone },
      { id: 'circles', label: 'Circles', hint: 'Entigrity community', icon: CircleDot },
      { id: 'client-surveys', label: 'Client Surveys', hint: 'Share your feedback', icon: ListChecks },
      { id: 'referrals', label: 'Client Referrals', hint: 'Refer a firm', icon: Gift },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: UserRound,
    modules: [
      { id: 'user-profile', label: 'User Profile', hint: 'Your details, photo & password', icon: UserRound },
      { id: 'client-contacts', label: 'Client Contacts', hint: 'Add contacts & send credentials', icon: Contact, designed: true },
      { id: 'contact-roles', label: 'Contact Roles', hint: 'Menu access per role', icon: ShieldCheck },
      { id: 'settings', label: 'Settings', hint: 'Email preferences', icon: Settings },
      { id: 'staff-agreements', label: 'Staff Agreements', hint: 'E-sign offer letters', icon: PenLine },
    ],
  },
  {
    id: 'other',
    label: 'More',
    icon: LayoutGrid,
    modules: [
      { id: 'account-manager', label: 'Account Manager', hint: 'Call, email or chat', icon: Headset, designed: true },
      { id: 'news-insights', label: 'News and Insights', hint: 'Industry news, updates & infographics', icon: Newspaper, designed: true },
      { id: 'other-modules', label: 'Other Modules & Services', hint: 'MyCPE ONE modules', icon: LayoutGrid, designed: true },
    ],
  },
];

/** Side menu: designed modules only (set `designed: true` as each module's design is done) */
export const CLIENT_DRAWER_GROUPS: ClientMenuGroup[] = CLIENT_MENU_GROUPS.filter((g) => g.id !== 'account' && g.id !== 'other').map((g) => ({
  ...g,
  modules: g.modules.filter((m) => m.designed),
})).filter((g) => g.modules.length > 0);

export const findClientModule = (id: string) =>
  CLIENT_MENU_GROUPS.flatMap((g) => g.modules).find((m) => m.id === id);
