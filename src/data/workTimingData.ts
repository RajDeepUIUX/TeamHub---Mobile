import { AddressType, DeliveryAddress, FlexRequest, FlexType } from '../types/workTiming';

export const CURRENT_SHIFT = '12:00 PM – 9:00 PM';

export interface FlexTypeMeta {
  type: FlexType;
  description: string;
  /** Tinted icon tile */
  tint: string;
  /** Whether to ask "Permanent or Temporary?" */
  asksDuration: boolean;
}

export const FLEX_TYPES: FlexTypeMeta[] = [
  { type: 'Work From Home', description: 'Work remotely, ongoing or for a period', tint: 'bg-sky-50 text-sky-600', asksDuration: true },
  { type: 'Work From Office', description: 'Set your in-office working hours', tint: 'bg-blue-50 text-[#2F68FE]', asksDuration: false },
  { type: 'Hybrid', description: 'Split your week between office and home', tint: 'bg-violet-50 text-violet-600', asksDuration: true },
  { type: 'Early Shift', description: 'Start and finish your day earlier', tint: 'bg-amber-50 text-amber-600', asksDuration: true },
  { type: 'Early Friday', description: 'Log out earlier on Fridays', tint: 'bg-emerald-50 text-emerald-600', asksDuration: true },
];

export const flexMeta = (type: FlexType) => FLEX_TYPES.find((t) => t.type === type)!;

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export const WEEKDAY_NAMES: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
};

/** 15-minute slots for the day: "00:00" … "23:45" */
export const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, '0');
  const m = String((i % 4) * 15).padStart(2, '0');
  return `${h}:${m}`;
});

/** "09:00" → minutes since midnight */
export const slotMinutes = (slot: string) => {
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m;
};

export const formatSpan = (start: string, end: string) => {
  const mins = slotMinutes(end) - slotMinutes(start);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
};



/** "2026-10-05" -> "5 Oct 2026" */
export const formatFlexDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** One-line "when" summary for a request */
export const flexPeriodLabel = (
  r: Pick<FlexRequest, 'type' | 'duration' | 'startDate' | 'endDate' | 'startTime' | 'endTime'>
) => {
  if (r.type === 'Work From Office') return `Office hours ${r.startTime} – ${r.endTime}`;
  if (!r.startDate) return r.duration === 'Permanent' ? 'Permanent · ongoing' : '';
  return r.duration === 'Permanent'
    ? `From ${formatFlexDate(r.startDate)} onwards`
    : `${formatFlexDate(r.startDate)} – ${formatFlexDate(r.endDate ?? r.startDate)}`;
};

/** Type-specific detail for a request, if any */
export const flexDetailLabel = (
  r: Pick<FlexRequest, 'type' | 'hybrid' | 'shift' | 'fridayLogout' | 'wfh' | 'startTime' | 'endTime'>
) => {
  if (r.type === 'Hybrid' && r.hybrid) {
    const h = r.hybrid;
    const when = h.mode === 'Daily' ? 'Daily' : (h.days ?? []).join(', ');
    return `${when} · WFO ${h.wfoFrom}–${h.wfoTo} · WFH ${h.wfhFrom}–${h.wfhTo}`;
  }
  if ((r.type === 'Work From Home' || r.type === 'Hybrid') && r.wfh) {
    const assetCount = Object.values(r.wfh.assets).reduce((n, q) => n + q, 0);
    return assetCount ? `${r.wfh.reason} · ${assetCount} ${assetCount === 1 ? 'asset' : 'assets'} requested` : r.wfh.reason;
  }
  if (r.type === 'Early Shift' && r.startTime && r.endTime) return `Shift ${r.startTime} – ${r.endTime}`;
  if (r.type === 'Early Friday' && r.startTime && r.endTime) return `Friday ${r.startTime} – ${r.endTime}`;
  return null;
};

/* ---------------------------- Work From Home ---------------------------- */

export const WFH_REASONS = [
  'Medical Conditions in the Family',
  'Medical Condition of Own-self',
  'Maternity',
  'Paternity',
  'Other',
];

export const WFH_ASSETS = ['CPU', 'Laptop', 'Monitor', 'Mouse', 'Keyboard', 'Headphones', 'Webcam'];
export const MAX_ASSET_QTY = 3;

export const WFH_ATTACHMENT_TYPES = 'image/jpeg,image/png';

/** Addresses on file for the signed-in staff member (prefill the delivery address) */
export const SAVED_ADDRESSES: Record<AddressType, DeliveryAddress> = {
  Current: {
    type: 'Current',
    address: '204, Silver Oak Residency, Sector 21',
    landmark: 'Near Central Park',
    country: 'India',
    state: 'Gujarat',
    city: 'Ahmedabad',
    zip: '380015',
  },
  Permanent: {
    type: 'Permanent',
    address: '12, Shanti Kunj Society, Station Road',
    landmark: 'Opposite Ram Mandir',
    country: 'India',
    state: 'Maharashtra',
    city: 'Nagpur',
    zip: '440001',
  },
};

export const COUNTRIES = ['India'];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

/* --------------------------- Team requests (demo) -------------------------- */

const submitted = (date: string, time = '11:00') => new Date(`${date}T${time}:00`).toISOString();

/** Flexibility requests from other members of the manager's team */
export const TEAM_FLEX_REQUESTS_SEED: FlexRequest[] = [
  {
    id: 'team-flex-ak-1',
    staffName: 'Ananya Kulkarni',
    staffCode: 'A03515',
    type: 'Work From Home',
    duration: 'Temporary',
    startDate: '2026-10-05',
    endDate: '2026-10-16',
    wfh: {
      reason: 'Medical Conditions in the Family',
      attachments: ['Discharge_Summary.jpg'],
      assets: { Laptop: 1, Headphones: 1 },
      deliveryAddress: {
        type: 'Current',
        address: 'B-12, Sunrise Apartments, Satellite',
        landmark: 'Near Jodhpur Cross Road',
        country: 'India',
        state: 'Gujarat',
        city: 'Ahmedabad',
        zip: '380015',
      },
      acknowledgedBy: 'Ananya Kulkarni',
      acknowledgedOn: '2026-09-28',
    },
    reason: 'My mother has knee surgery on 5 Oct; I need to be home for two weeks.',
    status: 'Pending',
    submittedAt: submitted('2026-09-28', '10:15'),
    comments: [
      {
        id: 'fc-ak-1',
        author: 'Ananya Kulkarni',
        role: 'Staff',
        text: "I've attached the hospital's discharge summary. I'll be online during regular hours.",
        createdAt: submitted('2026-09-28', '10:20'),
      },
    ],
  },
  {
    id: 'team-flex-np-1',
    staffName: 'Nidhi Purohit',
    staffCode: 'A03211',
    type: 'Hybrid',
    duration: 'Permanent',
    hybrid: { mode: 'Days', days: ['Tue', 'Thu'], wfoFrom: '10:00', wfoTo: '14:00', wfhFrom: '15:00', wfhTo: '19:00' },
    wfh: {
      reason: 'Other',
      attachments: [],
      assets: {},
      acknowledgedBy: 'Nidhi Purohit',
      acknowledgedOn: '2026-09-26',
    },
    reason: 'Long commute on client-call days; would like to take evening calls from home.',
    status: 'Pending',
    submittedAt: submitted('2026-09-26', '16:40'),
  },
  {
    id: 'team-flex-kd-1',
    staffName: 'Kunal Desai',
    staffCode: 'A02988',
    type: 'Early Friday',
    duration: 'Temporary',
    startDate: '2026-10-02',
    endDate: '2026-11-27',
    startTime: '09:00',
    endTime: '16:00',
    wfh: { reason: 'Other', attachments: [], assets: {} },
    reason: 'CA Final weekend coaching classes start at 5 PM on Fridays.',
    status: 'Approved',
    submittedAt: submitted('2026-09-18', '12:05'),
    managerComment: 'Approved till the exams — please keep Friday afternoons meeting-free on your calendar.',
    reviewedBy: 'Naveen Das',
    reviewedAt: 'Sep 19, 2026',
    comments: [
      {
        id: 'fc-kd-1',
        author: 'Naveen Das',
        role: 'Manager',
        text: 'Will this continue after the exams in November?',
        createdAt: submitted('2026-09-18', '15:30'),
      },
      {
        id: 'fc-kd-2',
        author: 'Kunal Desai',
        role: 'Staff',
        text: "No, only until 27 Nov. I'll switch back to regular hours after that.",
        createdAt: submitted('2026-09-18', '16:05'),
      },
      {
        id: 'fc-kd-3',
        author: 'System',
        role: 'System',
        text: 'Approved by Naveen Das',
        createdAt: submitted('2026-09-19', '10:00'),
      },
    ],
  },
];
