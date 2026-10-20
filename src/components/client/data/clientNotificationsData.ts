/** Client Hub notifications: one inbox for every module (same model as Staff / Manager `notificationsData`) */
import { MY_STAFF_SEED } from './clientStaffData';
import { clientInvoicesFor, formatMoney, invoicePeriodTitle } from './clientInvoicesData';
import { billableStaffOf, billingSeedFor, unmappedStaffIds } from './clientBillingData';
import { HUB_PROFILES_SEED } from './clientStaffHubData';

export type ClientNotificationCategory =
  | 'Announcements'
  | 'Attendance'
  | 'Leaves'
  | 'My Staff'
  | 'Resignation'
  | 'SOP'
  | 'Work Flexibility'
  | 'Hiring'
  | 'Invoices'
  | 'Timesheets'
  | 'Meetings'
  | 'Assessments'
  | 'Learning'
  | 'Holidays';

/** Chip order on the Notifications screen (only categories with items are shown) */
export const CLIENT_NOTIFICATION_CATEGORIES: ClientNotificationCategory[] = [
  'Announcements',
  'Attendance',
  'Leaves',
  'My Staff',
  'Resignation',
  'SOP',
  'Work Flexibility',
  'Hiring',
  'Invoices',
  'Timesheets',
  'Meetings',
  'Assessments',
  'Learning',
  'Holidays',
];

export interface ClientNotification {
  id: string;
  category: ClientNotificationCategory;
  title: string;
  body: string;
  createdAt: string; // ISO timestamp
  read: boolean;
  /**
   * Client menu module id opened on tap (`clientMenu.ts`); 'updates' opens the Important Updates sheet.
   * Every link points at a designed module (leaves → staff profile, meetings → Account Manager, holidays → Attendance Management).
   */
  link?: string;
  /** Highlights notifications that need the client to do something */
  actionRequired?: boolean;
  /** Record opened inside the module (e.g. invoice no. → Invoice Details, staff id → that staff profile) */
  targetId?: string;
  /** Staff profile tab opened with `targetId` (My Staff), or the Attendance Management tab ('amend') */
  targetTab?: string;
}

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** "Fri, Oct 16" for a date `days` from today; weekends roll forward to Monday (meetings, interviews, leaves) */
const workdayLabel = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
/** Next Monday ("Mon, Oct 19") */
const nextMondayLabel = () => workdayLabel(((8 - new Date().getDay()) % 7) || 7);

/** Staff without a payment method in the Billing Details seed (newest joiners) */
const unmappedNames = unmappedStaffIds(billingSeedFor(MY_STAFF_SEED), billableStaffOf(MY_STAFF_SEED).map((s) => s.id)).map(
  (id) => MY_STAFF_SEED.find((s) => s.id === id)?.name ?? id,
);
const nameList = (n: string[]) => (n.length > 1 ? `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}` : n[0] ?? '');

/** Hub resumes that match a profile the client already hired for (Available Staff Hub mock) */
const HUB_MATCH_PROFILE = 'Associate - Tax Preparer';
const hubMatchCount = HUB_PROFILES_SEED.filter((p) => p.profile === HUB_MATCH_PROFILE).length;

/** Latest timesheet invoice (Invoices › Invoices mock) */
const latestInvoice = clientInvoicesFor(MY_STAFF_SEED).find((i) => i.type === 'timesheet');

export const CLIENT_NOTIFICATIONS_SEED: ClientNotification[] = [
  {
    id: 'cn-1',
    category: 'Attendance',
    title: '3 attendance amend requests awaiting approval',
    body: 'Heena Kulkarni, Rohan Verma and Priti Bhatt asked to correct their attendance (Punching Error, Card Missing).',
    createdAt: ago(35),
    read: false,
    link: 'attendance',
    targetTab: 'amend',
    actionRequired: true,
  },
  {
    id: 'cn-2',
    category: 'SOP',
    title: 'SOP submitted by Kavya Reddy for approval',
    body: '“Client Onboarding Checklist” is pending. Approve, reject or mark it as not required.',
    createdAt: ago(95),
    read: false,
    link: 'my-staff',
    targetId: 'ms12',
    targetTab: 'SOP',
    actionRequired: true,
  },
  {
    id: 'cn-3',
    category: 'Announcements',
    title: '2 Important Updates from MYCPE ONE',
    body: 'Updated holiday calendar for 2027 · How should we share monthly invoices?',
    createdAt: ago(60 * 3),
    read: false,
    link: 'updates',
  },
  {
    id: 'cn-4',
    category: 'Hiring',
    title: 'Interview scheduled with Sam Patel',
    body: `Tax Preparer (Level 2) · ${workdayLabel(1)} · 10:30 AM EST on Zoom. Add your feedback after the call.`,
    createdAt: ago(60 * 5),
    read: false,
    link: 'interviews',
    actionRequired: true,
  },
  {
    id: 'cn-16',
    category: 'Hiring',
    title: `${hubMatchCount} new resumes match ${HUB_MATCH_PROFILE}`,
    body: 'Browse them in the Available Staff Hub, save the ones you like and shortlist candidates to interview.',
    createdAt: ago(60 * 7),
    read: false,
    link: 'staff-hub',
  },
  {
    id: 'cn-5',
    category: 'Invoices',
    title: latestInvoice ? `Invoice for ${invoicePeriodTitle(latestInvoice)} is ready` : 'New invoice is ready',
    body: latestInvoice
      ? `${latestInvoice.invoiceNo} · ${latestInvoice.lines.length} staff · ${formatMoney(latestInvoice.total)}. Timesheets are attached for review.`
      : 'Timesheets are attached for review.',
    createdAt: latestInvoice ? new Date(`${latestInvoice.createdOn}T09:00:00`).toISOString() : ago(60 * 9),
    read: false,
    link: 'invoices',
    actionRequired: latestInvoice?.status !== 'Paid',
    targetId: latestInvoice?.invoiceNo,
  },
  ...(unmappedNames.length
    ? [
        {
          id: 'cn-15',
          category: 'Invoices' as const,
          title: `${unmappedNames.length} staff need a payment method`,
          body: `${nameList(unmappedNames)} ${unmappedNames.length === 1 ? "isn't" : "aren't"} mapped to a bank account, card or Direct Pay yet. Map them in Billing Details.`,
          createdAt: ago(60 * 11),
          read: false,
          link: 'billing-details',
          actionRequired: true,
        },
      ]
    : []),
  {
    id: 'cn-14',
    category: 'Timesheets',
    title: "Last week's timesheets are ready",
    body: 'Hours for all current staff are in. Open Reports › Timesheets to review or export them as CSV.',
    createdAt: ago(60 * 14),
    read: false,
    link: 'timesheets',
  },
  {
    id: 'cn-6',
    category: 'Resignation',
    title: 'Resignation submitted by Isha Menon',
    body: 'Last working day would be Dec 5, 2026. Your account manager will share a replacement plan.',
    createdAt: ago(60 * 22),
    read: false,
    link: 'my-staff',
    targetId: 'ms11',
    targetTab: 'Work Information',
  },
  {
    id: 'cn-7',
    category: 'Work Flexibility',
    title: 'Complete your Work Flexibility Preferences',
    body: 'Tell us which staff can work Hybrid or From Home and which extra flexibilities you allow.',
    createdAt: ago(60 * 26),
    read: true,
    link: 'work-flexibility',
    actionRequired: true,
  },
  {
    id: 'cn-8',
    category: 'Leaves',
    title: 'Manav Saxena is on leave',
    body: `Paid Leave · ${workdayLabel(0)} (full day). Plan hand-offs for his open reviews.`,
    createdAt: ago(60 * 28),
    read: true,
    link: 'my-staff',
    targetId: 'ms13',
    targetTab: 'Attendance & Leave',
  },
  {
    id: 'cn-9',
    category: 'Assessments',
    title: '30-day staff assessment due for Mihir Chawla',
    body: 'Share how his first month went. It takes about 5 minutes.',
    createdAt: ago(60 * 30),
    read: true,
    link: 'feedback-evaluation',
    actionRequired: true,
  },
  {
    id: 'cn-10',
    category: 'My Staff',
    title: 'Replacement in progress for Nikhil Pandya',
    body: 'We have shortlisted 2 bookkeeper profiles. Review them in Shortlisted Candidates.',
    createdAt: ago(60 * 50),
    read: true,
    link: 'interviews',
  },
  {
    id: 'cn-11',
    category: 'Meetings',
    title: 'Monthly review with your account manager',
    body: `${nextMondayLabel()} · 9:00 AM EST. Agenda and last month’s utilization report are attached.`,
    createdAt: ago(60 * 52),
    read: true,
    link: 'account-manager',
  },
  {
    id: 'cn-12',
    category: 'Learning',
    title: 'Charvi Nair completed a mandatory course',
    body: 'Ethics for Tax Professionals (2 CPE hrs). 4 of 5 mandatory courses done.',
    createdAt: ago(60 * 74),
    read: true,
    link: 'mandatory-learning',
  },
  {
    id: 'cn-13',
    category: 'Holidays',
    title: 'Diwali — office closed Nov 8 to Nov 10',
    body: 'Staff on the busy-season OT plan will work remotely. Share urgent work by Nov 6.',
    createdAt: ago(60 * 96),
    read: true,
    link: 'attendance',
  },
];
