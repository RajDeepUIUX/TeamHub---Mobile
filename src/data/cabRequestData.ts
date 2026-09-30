// Support › Cab Request (mirrors the MYCPE ONE web form: One Time / Daily Basis → Temporary / Permanent)

export type CabFor = 'One Time' | 'Daily Basis';
export type CabRequestType = 'Temporary' | 'Permanent';
export type CabStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Terminated';
export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface CabReview {
  by: string;
  comment: string;
  on: string; // ISO date
}

export interface CabRequest {
  id: string;
  staffName: string;
  staffCode: string;
  cabFor: CabFor;
  /** Daily Basis only */
  requestType?: CabRequestType;
  /** One Time and Daily › Temporary (One Time: fromDate === toDate) */
  fromDate?: string;
  toDate?: string;
  pickupTime: string;
  /** Daily › Permanent only */
  days: Weekday[];
  city: string;
  dropArea: string;
  status: CabStatus;
  submittedOn: string;
  terminatedOn?: string;
  review?: CabReview;
}

export type CabDraft = Pick<CabRequest, 'cabFor' | 'requestType' | 'fromDate' | 'toDate' | 'pickupTime' | 'days' | 'city' | 'dropArea'>;

export const CAB_STATUSES: CabStatus[] = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Terminated'];

export const STATUS_CHIP: Record<CabStatus, string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  Approved: 'bg-[#E8F8F0] text-[#10B981]',
  Rejected: 'bg-rose-50 text-rose-500',
  Cancelled: 'bg-slate-100 text-slate-500',
  Terminated: 'bg-violet-50 text-violet-600',
};

export const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/** Same slots as the web portal: every hour at :30 */
export const PICKUP_TIMES: string[] = Array.from({ length: 24 }, (_, h) => {
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:30 ${h < 12 ? 'AM' : 'PM'}`;
});

export const CAB_CITIES: Record<string, string[]> = {
  Ahmedabad: [
    'AMRAIWADI', 'VASTRAL', 'HATKESHWAR', 'MANINAGAR', 'CTM', 'THAKKARNAGAR', 'BAPUNAGAR', 'NARODA', 'SAIJPUR BOGHA',
    'HATHIJAN', 'DARIYAPUR', 'SHAHPUR', 'CHANDLODIYA', 'RAIPUR', 'LAMBHA', 'NAROL', 'RAMOL', 'SATYAM NAGAR', 'VATVA',
    'BAVLA', 'MEMNAGAR', 'VEJALPUR', 'ISANPUR', 'JANTA NAGAR', 'KALUPUR', 'JHAMPHALVAADI', 'GOTA',
  ],
  Baroda: ['ALKAPURI', 'GOTRI', 'MANJALPUR', 'KARELIBAUG', 'FATEHGUNJ', 'WAGHODIA ROAD', 'SAMA'],
  Indore: ['VIJAY NAGAR', 'PALASIA', 'RAJENDRA NAGAR', 'BHANWARKUAN', 'SUDAMA NAGAR'],
  Jaipur: ['MALVIYA NAGAR', 'VAISHALI NAGAR', 'MANSAROVAR', 'JAGATPURA', 'RAJA PARK'],
  Kochi: ['KAKKANAD', 'EDAPPALLY', 'VYTTILA', 'PALARIVATTOM', 'ALUVA'],
  Rajkot: ['KALAWAD ROAD', 'RAIYA ROAD', 'MAVDI', 'UNIVERSITY ROAD', 'GONDAL ROAD'],
  Coimbatore: ['RS PURAM', 'GANDHIPURAM', 'PEELAMEDU', 'SAIBABA COLONY', 'SINGANALLUR'],
  Nagpur: ['DHARAMPETH', 'SITABULDI', 'MANISH NAGAR', 'SADAR', 'WARDHA ROAD'],
  Nashik: ['GANGAPUR ROAD', 'COLLEGE ROAD', 'INDIRA NAGAR', 'CIDCO', 'PANCHAVATI'],
  Lucknow: ['GOMTI NAGAR', 'HAZRATGANJ', 'ALIGANJ', 'INDIRA NAGAR', 'ALAMBAGH'],
  Chandigarh: ['SECTOR 17', 'SECTOR 22', 'SECTOR 35', 'MANIMAJRA', 'SECTOR 43'],
  Raipur: ['SHANKAR NAGAR', 'TELIBANDHA', 'PANDRI', 'DEVENDRA NAGAR', 'MOWA'],
};

export const CITY_NAMES = Object.keys(CAB_CITIES);

/** "2026-09-30" -> "Sep 30, 2026" */
export const formatCabDate = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

/** Title-case the portal's upper-case area names for display */
export const prettyArea = (area: string) => area.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const cabTitle = (r: Pick<CabRequest, 'cabFor' | 'requestType'>) =>
  r.cabFor === 'One Time' ? 'One Time Cab' : `Daily Cab · ${r.requestType}`;

export const shortDays = (days: Weekday[]) =>
  days.length === WEEKDAYS.length ? 'Mon – Fri' : WEEKDAYS.filter((d) => days.includes(d)).map((d) => d.slice(0, 3)).join(', ');

/** A daily cab that is (or will be) running: approved and not past its end date */
export const isRunningDaily = (r: CabRequest, today: string) =>
  r.cabFor === 'Daily Basis' && r.status === 'Approved' && (r.requestType === 'Permanent' || (r.toDate ?? '') >= today);

export const canCancel = (r: CabRequest, today: string) =>
  r.status === 'Pending' || (r.status === 'Approved' && r.cabFor === 'One Time' && (r.fromDate ?? '') >= today);

export const canStop = (r: CabRequest, today: string) => isRunningDaily(r, today);

const overlaps = (aFrom: string, aTo: string, bFrom: string, bTo: string) => aFrom <= bTo && bFrom <= aTo;
const FAR_FUTURE = '9999-12-31';

/** Explains why a new request clashes with one already pending/approved, or null when it's fine */
export const findClash = (draft: CabDraft, mine: CabRequest[], today: string, ignoreId?: string): string | null => {
  const live = mine.filter((r) => r.id !== ignoreId && (r.status === 'Pending' || r.status === 'Approved'));
  const range = (r: Pick<CabRequest, 'cabFor' | 'requestType' | 'fromDate' | 'toDate'>): [string, string] =>
    r.cabFor === 'Daily Basis' && r.requestType === 'Permanent' ? [today, FAR_FUTURE] : [r.fromDate ?? today, r.toDate ?? r.fromDate ?? today];
  const [from, to] = range(draft);
  for (const r of live) {
    if (r.cabFor !== draft.cabFor) continue;
    const [rFrom, rTo] = range(r);
    if (rTo < today || !overlaps(from, to, rFrom, rTo)) continue;
    return draft.cabFor === 'One Time'
      ? `You already have a cab request for ${formatCabDate(draft.fromDate)}.`
      : `You already have ${r.status === 'Approved' ? 'an approved' : 'a pending'} ${cabTitle(r).toLowerCase()} (${r.pickupTime}, ${prettyArea(
          r.dropArea
        )}) for these dates. ${r.status === 'Approved' ? 'Stop' : 'Cancel'} it from your requests before raising a new one.`;
  }
  return null;
};

type Staff = Pick<CabRequest, 'staffName' | 'staffCode'>;
const JOHN: Staff = { staffName: 'John Smith', staffCode: 'A03780' };
const ANANYA: Staff = { staffName: 'Ananya Kulkarni', staffCode: 'A03515' };
const KUNAL: Staff = { staffName: 'Kunal Desai', staffCode: 'A02988' };
const NIDHI: Staff = { staffName: 'Nidhi Purohit', staffCode: 'A03211' };

export const CAB_MANAGER = 'Naveen Das';
/** Team members whose cab requests the manager (Naveen Das) reviews */
export const CAB_TEAM = [JOHN, ANANYA, KUNAL, NIDHI].map((s) => s.staffName);

/** Everyone's requests in one list so a manager's decision shows up on the staff side and vice versa */
export const CAB_REQUESTS_SEED: CabRequest[] = [
  {
    id: 'cab-1',
    ...JOHN,
    cabFor: 'One Time',
    fromDate: '2026-10-03',
    toDate: '2026-10-03',
    pickupTime: '11:30 PM',
    days: [],
    city: 'Ahmedabad',
    dropArea: 'VASTRAL',
    status: 'Pending',
    submittedOn: '2026-09-29',
  },
  {
    id: 'cab-2',
    ...JOHN,
    cabFor: 'Daily Basis',
    requestType: 'Permanent',
    pickupTime: '08:30 PM',
    days: [...WEEKDAYS],
    city: 'Ahmedabad',
    dropArea: 'MEMNAGAR',
    status: 'Approved',
    submittedOn: '2026-06-01',
    review: { by: CAB_MANAGER, comment: 'Approved. The transport desk will share your route and driver details.', on: '2026-06-02' },
  },
  {
    id: 'cab-3',
    ...JOHN,
    cabFor: 'One Time',
    fromDate: '2026-08-14',
    toDate: '2026-08-14',
    pickupTime: '12:30 AM',
    days: [],
    city: 'Ahmedabad',
    dropArea: 'GOTA',
    status: 'Rejected',
    submittedOn: '2026-08-12',
    review: { by: CAB_MANAGER, comment: 'The office is closed on Independence Day eve after 10 PM. Please use the shuttle at 09:30 PM.', on: '2026-08-13' },
  },
  {
    id: 'cab-4',
    ...JOHN,
    cabFor: 'Daily Basis',
    requestType: 'Temporary',
    fromDate: '2026-03-02',
    toDate: '2026-03-27',
    pickupTime: '07:30 PM',
    days: [],
    city: 'Ahmedabad',
    dropArea: 'NARODA',
    status: 'Terminated',
    submittedOn: '2026-02-26',
    terminatedOn: '2026-03-20',
    review: { by: CAB_MANAGER, comment: 'Approved for the release sprint.', on: '2026-02-27' },
  },
  {
    id: 'cab-10',
    ...ANANYA,
    cabFor: 'Daily Basis',
    requestType: 'Temporary',
    fromDate: '2026-10-05',
    toDate: '2026-10-30',
    pickupTime: '06:30 AM',
    days: [],
    city: 'Ahmedabad',
    dropArea: 'SATYAM NAGAR',
    status: 'Pending',
    submittedOn: '2026-09-28',
  },
  {
    id: 'cab-11',
    ...KUNAL,
    cabFor: 'One Time',
    fromDate: '2026-10-01',
    toDate: '2026-10-01',
    pickupTime: '10:30 PM',
    days: [],
    city: 'Baroda',
    dropArea: 'ALKAPURI',
    status: 'Pending',
    submittedOn: '2026-09-30',
  },
  {
    id: 'cab-12',
    ...NIDHI,
    cabFor: 'Daily Basis',
    requestType: 'Permanent',
    pickupTime: '09:30 PM',
    days: [...WEEKDAYS],
    city: 'Ahmedabad',
    dropArea: 'VEJALPUR',
    status: 'Approved',
    submittedOn: '2026-04-14',
    review: { by: CAB_MANAGER, comment: 'Approved for the US shift.', on: '2026-04-15' },
  },
  {
    id: 'cab-13',
    ...KUNAL,
    cabFor: 'One Time',
    fromDate: '2026-09-12',
    toDate: '2026-09-12',
    pickupTime: '02:30 AM',
    days: [],
    city: 'Ahmedabad',
    dropArea: 'ISANPUR',
    status: 'Rejected',
    submittedOn: '2026-09-11',
    review: { by: CAB_MANAGER, comment: 'Weekend deployment was moved to Monday, so no late pickup is needed.', on: '2026-09-11' },
  },
];
