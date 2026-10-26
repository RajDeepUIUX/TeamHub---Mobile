/** Mock data for the Client Dashboard (desktop `dashboard` controller + `templates/dashboard/index.tpl`) */
import { CURRENT_STAFF_STATUSES, ClientStaffMember, MY_STAFF_SEED } from './clientStaffData';
import { TimesheetRange, addDays, defaultTimesheetRange, isoOf, timesheetRowsFor } from './clientTimesheetsData';

export type ClientFeedTab =
  | 'HRMS Feature Updates'
  | 'Operational Updates'
  | 'Best Practices & Insights'
  | 'Services & Solutions'
  | 'Events & Celebrations';

/** Desktop tab order (visible tabs come from the DB `menutab` list) */
export const CLIENT_FEED_TABS: ClientFeedTab[] = [
  'HRMS Feature Updates',
  'Operational Updates',
  'Best Practices & Insights',
  'Services & Solutions',
  'Events & Celebrations',
];

export type ClientReaction = 'like' | 'dislike' | null;

export interface ClientPollOption {
  id: string;
  label: string;
  votes: number;
}

/** YouTube video attached to a post (desktop embeds it as an iframe) */
export interface ClientVideo {
  title: string;
  channel: string;
  /** YouTube video id (watch?v=<id>) */
  youtubeId: string;
}

/** A dashboard post (feed item or Important Update): text, optional video / poll, like-dislike */
export interface ClientPost {
  id: string;
  title: string;
  /** ISO date (yyyy-mm-dd) */
  publishDate: string;
  /**
   * Rich text like the desktop post body: blank line = new paragraph, "- " = bullet,
   * **bold**, *italic*, [label](url)
   */
  description: string;
  video?: ClientVideo;
  poll?: {
    options: ClientPollOption[];
    /** ISO date; after it the poll shows results only */
    validTill: string;
    /** Option this client voted for (one vote per poll) */
    selectedOptionId?: string;
  };
  /** Reaction saved on the server for this client */
  reaction: ClientReaction;
}

export interface ClientFeedPost extends ClientPost {
  tab: ClientFeedTab;
  unread?: boolean;
}

export const CLIENT_FEED_SEED: ClientFeedPost[] = [
  /* ---------------------------- HRMS Feature Updates ---------------------------- */
  {
    id: 'f77',
    tab: 'HRMS Feature Updates',
    title: 'Client Update #77: HRMS Feature Update : Generate AI Powered SOP',
    publishDate: '2026-07-17',
    description: `Hello Everyone,

A quick (and very real) story: a team member leaves, everyone wishes them well… and then comes the moment — *"Wait, how were they handling this again?"* Suddenly a smooth transition turns into a detective mission of digging through emails and re-training from scratch.

We've all been there — so we decided to fix it.

**Introducing AI-Based SOP Creation, now live in our HRMS.** (Here is a [sample AI-SOP](https://resources.northwindcpa.example/))

It's as simple as it sounds:

- Record your process (Zoom, screen recording — anything)
- Upload the video
- Our system turns it into a structured SOP
No blank Word docs, no lengthy documentation.

Think of it as a "brain backup" for your processes — so knowledge lives in client-, process-, and service-specific SOPs instead of walking out the door when someone leaves.

**Where you come in:** the real value comes when this becomes a habit, not a one-time task. It would help if you could nudge your offshore team to document key workflows and make sure important client and process knowledge is being captured.

To try it: **Generate AI Powered SOP → upload video → SOP ready.** No training needed.

We've now made it mandatory for all our offshore staff to create their SOPs, publish them, and get them approved by you. I hope that helps.

We genuinely believe this is one of those small changes that quietly solves a big problem — especially around attrition and re-training. Happy to walk you through it anytime (10 minutes, promise!).

Regards,
MYCPE ONE`,
    unread: true,
    reaction: null,
  },
  {
    id: 'f74',
    tab: 'HRMS Feature Updates',
    title: 'Client Update #74: HRMS Feature Update : Staff Utilization Report',
    publishDate: '2026-04-27',
    description: `Hello Everyone,

The new **Staff Utilization Report** shows how productively each of your offshore staff spends their logged hours.

- Pick a range: current week, last week, last month, last quarter or custom
- See staff grouped into utilization buckets: ≤50%, 51–70%, 71–90% and ≥90%
- Open any staff member for the activity log behind the numbers

Watch the short walkthrough below and find it under **Reports → Staff Utilization Report**.

Regards,
MYCPE ONE`,
    video: { title: 'Staff Utilization Report walkthrough', channel: 'MYCPE ONE', youtubeId: 'aqz-KE-bpKQ' },
    reaction: 'like',
  },
  {
    id: 'f72',
    tab: 'HRMS Feature Updates',
    title: 'Client Update #72: Which feature should we build next?',
    publishDate: '2026-04-10',
    description: `Help us prioritize the HRMS roadmap. Pick the feature that would save your team the most time.`,
    poll: {
      validTill: '2026-12-31',
      options: [
        { id: 'p1', label: 'Shared task board with staff', votes: 42 },
        { id: 'p2', label: 'Timesheet approval on mobile', votes: 31 },
        { id: 'p3', label: 'Monthly invoice summary email', votes: 17 },
      ],
    },
    reaction: null,
  },
  {
    id: 'f70',
    tab: 'HRMS Feature Updates',
    title: 'Client Update #70: HRMS Feature Update : Combined Invoice PDFs',
    publishDate: '2026-03-02',
    description: `Hello Everyone,

**Invoices & Timesheets** now lets you export one combined PDF for all staff in a billing period — month-end reconciliation takes one download instead of many.

Regards,
MYCPE ONE`,
    reaction: null,
  },

  /* ---------------------------- Operational Updates ---------------------------- */
  {
    id: 'f80',
    tab: 'Operational Updates',
    title: 'Client Update #80: Operational Update : Diwali Holidays (Nov 8 – Nov 10)',
    publishDate: '2026-10-05',
    description: `Hello Everyone,

Our India offices will be closed for **Diwali from Nov 8 to Nov 10, 2026**.

- Staff on the busy-season OT plan will keep working remotely
- Please share urgent deliverables with your account manager by **Nov 6**
- Regular working hours resume on Nov 11

Wishing you and your team a bright and happy Diwali!

Regards,
MYCPE ONE`,
    unread: true,
    reaction: null,
  },
  {
    id: 'f79',
    tab: 'Operational Updates',
    title: 'Client Update #79: Operational Update : US Daylight Saving Shift Change',
    publishDate: '2026-10-01',
    description: `Hello Everyone,

US daylight saving time ends on **Nov 1, 2026**. Your staff's shift timings stay the same in your time zone, so their India login time moves one hour later.

If you'd like a different overlap window, reply to your account manager and we'll plan it with you.

Regards,
MYCPE ONE`,
    reaction: null,
  },
  {
    id: 'f66',
    tab: 'Operational Updates',
    title: 'Client Update #66: Was this year’s onboarding smooth?',
    publishDate: '2026-02-14',
    description: `Tell us how the onboarding of your newest staff went.`,
    poll: {
      validTill: '2026-03-31',
      options: [
        { id: 'p4', label: 'Very smooth', votes: 58 },
        { id: 'p5', label: 'Mostly fine', votes: 29 },
        { id: 'p6', label: 'Needs improvement', votes: 13 },
      ],
    },
    reaction: null,
  },

  /* -------------------------- Best Practices & Insights -------------------------- */
  {
    id: 'f78',
    tab: 'Best Practices & Insights',
    title: 'Client Update #78: Best Practices : Five habits of high-performing offshore teams',
    publishDate: '2026-08-18',
    description: `Hello Everyone,

We looked at the firms whose offshore teams consistently hit **90%+ utilization**. Five habits stood out:

- A 10-minute daily stand-up during your overlap hours
- One shared task repository instead of email threads
- Approved SOPs for every recurring workflow
- Weekly feedback, even when it's just "all good"
- Protected overlap hours for questions and reviews

*Small routines, big difference.* Pick one to start this month.

Regards,
MYCPE ONE`,
    unread: true,
    reaction: null,
  },
  {
    id: 'f75',
    tab: 'Best Practices & Insights',
    title: 'Client Update #75: Insights : Writing SOPs your team will actually use',
    publishDate: '2026-06-09',
    description: `Hello Everyone,

The best SOPs are short, specific and easy to update. A few tips from our process team:

- Write for the next person, not the expert
- One SOP per task — split long processes into parts
- Add screenshots or a screen recording for tricky steps
- Review SOPs every quarter or after any client change

Read the full guide in [Client Resources](https://resources.northwindcpa.example/).

Regards,
MYCPE ONE`,
    reaction: null,
  },

  /* ---------------------------- Services & Solutions ---------------------------- */
  {
    id: 'f76',
    tab: 'Services & Solutions',
    title: 'Client Update #76: Services : Seasonal Staffing for the 2027 Tax Season',
    publishDate: '2026-09-01',
    description: `Hello Everyone,

Reserve temporary **tax preparers and reviewers for January – April 2027**. Early requests get first pick of experienced profiles from the Available Staff Hub.

- 1040, 1065, 1120 and 1120-S experience
- Software: CCH Axcess, Drake, Lacerte, UltraTax
- Flexible hours with optional weekend support

Raise a request under **Hire New Staff → Temp / Seasonal Staffing**.

Regards,
MYCPE ONE`,
    reaction: null,
  },
  {
    id: 'f73',
    tab: 'Services & Solutions',
    title: 'Client Update #73: Solutions : Managed IT & Cybersecurity for CPA Firms',
    publishDate: '2026-05-12',
    description: `Hello Everyone,

Our **MSP** and **MSSP** services are now available to every HRMS client — managed IT, endpoint security and compliance support built for accounting firms.

See plans under **Other Modules & Services** or [view pricing](https://resources.northwindcpa.example/msp-pricing).

Regards,
MYCPE ONE`,
    reaction: null,
  },

  /* ---------------------------- Events & Celebrations ---------------------------- */
  {
    id: 'f81',
    tab: 'Events & Celebrations',
    title: 'Client Update #81: Events : Navratri Celebrations at Entigrity',
    publishDate: '2026-10-12',
    description: `Hello Everyone,

Our Ahmedabad and Rajkot offices came alive with **Garba night** last Friday — colorful outfits, music and plenty of dancing. A big thank-you to the teams who planned it!

Here's a glimpse of the evening.

Regards,
MYCPE ONE`,
    video: { title: 'Garba Night 2026 at Entigrity', channel: 'Entigrity', youtubeId: 'aqz-KE-bpKQ' },
    unread: true,
    reaction: null,
  },
  {
    id: 'f71',
    tab: 'Events & Celebrations',
    title: 'Client Update #71: Celebrations : Another year together!',
    publishDate: '2026-03-20',
    description: `Hello Everyone,

This month we celebrate **another year** of building offshore teams with CPA firms like yours.

- A growing team of offshore professionals
- Client firms across the US, UK and Canada

*Thank you for trusting us with your team.*

Regards,
MYCPE ONE`,
    reaction: 'like',
  },
];

/** Posts shown per page; "Show More" loads the next page (desktop `load_more_onboarding`) */
export const CLIENT_FEED_PAGE_SIZE = 3;

export type OffshorePeriod = 'Past Week' | 'Past Month' | 'Past Quarter' | 'Current Year';

export const OFFSHORE_PERIODS: OffshorePeriod[] = ['Past Week', 'Past Month', 'Past Quarter', 'Current Year'];

export interface OffshoreStaff {
  id: string;
  name: string;
  designation: string;
  /** Productive hours per period; null shows "–" (no tracked time) */
  productiveHrs: Record<OffshorePeriod, number | null>;
}

/** Productive hours = logged timesheet hours (Reports › Timesheets mock), so the dashboard matches that report */
const OFFSHORE_RANGES = (today = new Date()): Record<OffshorePeriod, TimesheetRange> => {
  const yesterday = addDays(isoOf(today), -1);
  return {
    'Past Week': defaultTimesheetRange(today),
    'Past Month': { from: addDays(yesterday, -29), to: yesterday },
    'Past Quarter': { from: addDays(yesterday, -89), to: yesterday },
    'Current Year': { from: `${today.getFullYear()}-01-01`, to: yesterday },
  };
};

const roundHalf = (seconds: number) => Math.round((seconds / 3600) * 2) / 2;

/** Current staff (My Staff default view, A–Z) with their productive hours per period; null = nothing logged */
export const offshoreStaffFrom = (staff: ClientStaffMember[], today = new Date()): OffshoreStaff[] => {
  const current = staff.filter((s) => CURRENT_STAFF_STATUSES.includes(s.status)).sort((a, b) => a.name.localeCompare(b.name));
  const ranges = OFFSHORE_RANGES(today);
  const hours = Object.fromEntries(
    OFFSHORE_PERIODS.map((p) => {
      const totals = new Map<string, number>();
      timesheetRowsFor(current, ranges[p], today).forEach((r) => totals.set(r.staffId, (totals.get(r.staffId) ?? 0) + r.workingSeconds));
      return [p, totals];
    }),
  ) as Record<OffshorePeriod, Map<string, number>>;
  return current.map((s) => ({
    id: s.id,
    name: s.name,
    designation: s.designation,
    productiveHrs: Object.fromEntries(
      OFFSHORE_PERIODS.map((p) => {
        const secs = hours[p].get(s.id);
        return [p, secs ? roundHalf(secs) : null];
      }),
    ) as Record<OffshorePeriod, number | null>,
  }));
};

export const OFFSHORE_STAFF_SEED: OffshoreStaff[] = offshoreStaffFrom(MY_STAFF_SEED);

/* --------------------------- Staff Utilization --------------------------- */

/** Desktop Staff Utilization Report date ranges (`staff_utilization_report` daterangepicker); default Last Week */
export type UtilizationPeriod = 'Current Week' | 'Last Week' | 'Last Month' | 'Last Quarter' | 'Custom Range';

export const UTILIZATION_PERIODS: UtilizationPeriod[] = ['Current Week', 'Last Week', 'Last Month', 'Last Quarter', 'Custom Range'];

export const DEFAULT_UTILIZATION_PERIOD = 'Last Week' satisfies UtilizationPeriod;

/** Desktop ranges: ISO weeks (Mon–Sun), previous calendar month / quarter */
export const utilizationRangeFor = (period: Exclude<UtilizationPeriod, 'Custom Range'>, today = new Date()): TimesheetRange => {
  const todayKey = isoOf(today);
  const monday = addDays(todayKey, -((today.getDay() + 6) % 7));
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (period) {
    case 'Current Week':
      return { from: monday, to: todayKey };
    case 'Last Week':
      return { from: addDays(monday, -7), to: addDays(monday, -1) };
    case 'Last Month':
      return { from: isoOf(new Date(y, m - 1, 1)), to: isoOf(new Date(y, m, 0)) };
    case 'Last Quarter': {
      const q = Math.floor(m / 3);
      return { from: isoOf(new Date(y, (q - 1) * 3, 1)), to: isoOf(new Date(y, q * 3, 0)) };
    }
  }
};

export type UtilizationBandId = 'low' | 'mid' | 'high';

export interface UtilizationBand {
  id: UtilizationBandId;
  label: string;
  name: string;
}

/** Productivity % split into three ranges (no gaps: ≤30, >30–60, >60) */
export const UTILIZATION_BANDS: UtilizationBand[] = [
  { id: 'low', label: '0–30%', name: 'Low' },
  { id: 'mid', label: '31–60%', name: 'Moderate' },
  { id: 'high', label: '61–100%', name: 'High' },
];

export const utilizationBandOf = (pct: number): UtilizationBandId => (pct <= 30 ? 'low' : pct <= 60 ? 'mid' : 'high');

export interface StaffUtilization {
  id: string;
  name: string;
  designation: string;
  totalSeconds: number;
  productiveSeconds: number;
  /** Desktop: round(productive / total × 100, 2) */
  productivity: number;
}

const seeded = (key: string) => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
};

/**
 * Current staff with tracked time in the range (desktop skips staff with no hours).
 * Total hours = logged timesheet hours; the productive share is dummy activity data (steady per staff, small swing per range).
 */
export const staffUtilizationFor = (staff: ClientStaffMember[], range: TimesheetRange, today = new Date()): StaffUtilization[] => {
  const current = staff.filter((s) => CURRENT_STAFF_STATUSES.includes(s.status));
  const totals = new Map<string, number>();
  timesheetRowsFor(current, range, today).forEach((r) => totals.set(r.staffId, (totals.get(r.staffId) ?? 0) + r.workingSeconds));
  return current
    .filter((s) => (totals.get(s.id) ?? 0) > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => {
      const totalSeconds = totals.get(s.id) ?? 0;
      const share = Math.min(0.99, Math.max(0.08, 0.12 + seeded(s.id) * 0.86 + (seeded(`${s.id}_${range.from}_${range.to}`) - 0.5) * 0.12));
      const productiveSeconds = Math.round((totalSeconds * share) / 60) * 60;
      return {
        id: s.id,
        name: s.name,
        designation: s.designation,
        totalSeconds,
        productiveSeconds,
        productivity: Math.round((productiveSeconds / totalSeconds) * 10000) / 100,
      };
    });
};

/** Attendance amend requests waiting for this client (badge on the Approvals tab) */
export const PENDING_ATTENDANCE_APPROVALS = 3;

/** Desktop sidebar Account Manager card (`generalmanagerData`) */
export const CLIENT_ACCOUNT_MANAGER = {
  name: 'Karan Bhatia',
  role: 'Account Manager · Entigrity',
  hours: 'Mon–Fri · 9:00 AM – 6:00 PM EST',
  email: 'karan.bhatia@example.com',
  phone: '+1 (555) 010-0148',
  whatsapp: '+1 (555) 010-0149',
  slack: '#northwind-cpa-team',
};

/** Staff rows shown on the dashboard before "View all" */
export const OFFSHORE_PREVIEW_COUNT = 6;

export type ClientImportantUpdate = ClientPost;

/** Desktop "Important Updates" popup (after login until Skip / Mark As Read) */
export const CLIENT_IMPORTANT_UPDATES_SEED: ClientImportantUpdate[] = [
  {
    id: 'u1',
    title: 'Updated holiday calendar for 2027',
    publishDate: '2026-10-12',
    description:
      'The 2027 India holiday list is now available under Human Resources → Holidays. Please plan deadlines around these dates and share critical due dates with your staff early.',
    reaction: null,
  },
  {
    id: 'u2',
    title: 'How should we share monthly invoices?',
    publishDate: '2026-10-03',
    description: 'We are improving how invoices reach you. Pick the option that works best for your firm.',
    poll: {
      validTill: '2026-12-31',
      options: [
        { id: 'u2a', label: 'Email with PDF attached', votes: 64 },
        { id: 'u2b', label: 'Portal notification only', votes: 21 },
        { id: 'u2c', label: 'Both', votes: 37 },
      ],
    },
    reaction: null,
  },
];

/**
 * Other Modules & Services (desktop header megamenu). Current = MyCPE ONE `my_modules`, Other = `explore_services`
 * (price tag = its `p`) + MSP / MSSP; AssureOne SSO via `dashboard&task=mycpeServiceSSO` → MyCPE ONE `mycpe-service-sso`
 * (type 1 AssurePro; AssureBooks / AssureFlow are commented out in `sidebar.tpl`). Benchmarking only shows when `explore_services` has it.
 * Mobile: dashboard "Services You May Need" card → ClientServicesSheet
 */
export interface ClientService {
  id: string;
  title: string;
  description: string;
  /** Current Services: enabled for this firm. 'current' = this app (HRMS) */
  state?: 'current' | 'enabled';
  url?: string;
  /** AssureOne apps open through SSO */
  sso?: boolean;
  tag?: string;
}

export interface ClientServiceSection {
  id: string;
  title: string;
  description: string;
  services: ClientService[];
}

export const CLIENT_SERVICE_SECTIONS: ClientServiceSection[] = [
  {
    id: 'current',
    title: 'Current Services',
    description: 'Solutions currently enabled for your firm.',
    services: [
      { id: 'mycpe', title: 'Continuing Education', description: 'Access CPE, Firm wide compliance and tools for your team.', state: 'enabled', url: 'https://resources.northwindcpa.example/' },
      { id: 'assessment', title: 'Assessments', description: 'Evaluate hiring and team skills with AI-powered assessments.', state: 'enabled', url: 'https://resources.northwindcpa.example/' },
      { id: 'erp', title: 'HRMS 24 x 7 (Offshoring)', description: 'End-to-End Team Management, Billing & HR Operations.', state: 'current' },
    ],
  },
  {
    id: 'other',
    title: 'Other Services',
    description: "Additional services and tools available to support your firm's growth.",
    services: [
      { id: 'dg', title: 'Digital Marketing', description: 'Growth marketing solutions for CPA & accounting firms.', url: 'https://resources.northwindcpa.example/', tag: 'Starts From $149/month' },
      { id: 'wd', title: 'Website Services', description: 'AI-powered CPA websites built & managed for firms.', url: 'https://resources.northwindcpa.example/', tag: 'Starts From $49/month' },
      { id: 'msp', title: 'MSP', description: 'Managed IT services built for CPA and accounting firms.', url: 'https://resources.northwindcpa.example/msp-pricing' },
      { id: 'mssp', title: 'MSSP', description: 'Managed cybersecurity and compliance protection for firms.', url: 'https://resources.northwindcpa.example/mssp-pricing' },
    ],
  },
  {
    id: 'assureone',
    title: 'AssureOne',
    description: 'AI-first assurance suite. Practice, books, and audit in one workspace.',
    services: [
      { id: 'assurepro', title: 'AssurePro', description: 'AI-first practice management. Your firm, one workspace.', sso: true, url: 'https://pro.assureone.ai/' },
    ],
  },
];

/** Desktop sidebar static menu "News and Insights" (`sidebar.tpl`, 6 resource pages, open in a new tab) */
export const CLIENT_NEWS_LINKS = [
  { id: 'trending-news', label: 'Trending News', hint: 'Finance & economics headlines', url: 'https://resources.northwindcpa.example/dashboard/insights-finance-economics' },
  { id: 'accounting-industry', label: 'Accounting Industry', hint: 'What is moving the profession', url: 'https://resources.northwindcpa.example/dashboard/insights-accounting-industry' },
  { id: 'regulatory-updates', label: 'Regulatory Updates', hint: 'Rule and compliance changes', url: 'https://resources.northwindcpa.example/dashboard/insights-regulatory-updates' },
  { id: 'infographics', label: 'Infographics', hint: 'Quick visual summaries', url: 'https://resources.northwindcpa.example/dashboard/insights-infographics' },
  { id: 'accounting-pulse', label: 'Accounting Pulse', hint: 'Regular pulse on the industry', url: 'https://resources.northwindcpa.example/dashboard/insights-accounting-pulse' },
  { id: 'industry-insights', label: 'Industry insights', hint: 'Benchmarking blogs', url: 'https://resources.northwindcpa.example/dashboard/insights-benchmarking-blogs' },
];
