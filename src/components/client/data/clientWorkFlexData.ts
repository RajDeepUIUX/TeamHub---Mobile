/** Mock data for Human Resources → Staff Work Flexibility (desktop `staff_work_flexibility` controller + template) */
import type React from 'react';
import { CalendarCheck, CalendarDays, Clock, Home, Moon, Shuffle, Sun } from 'lucide-react';
import { CURRENT_STAFF_STATUSES, ClientStaffMember, MY_STAFF_SEED } from './clientStaffData';
import { workInfoFor } from './clientStaffProfileData';

export type FlexModeKey = 'hyb' | 'wfh';
export type ArrangementKey = 'permanent' | 'seasonal' | 'non_seasonal' | 'on_request';
/** Hybrid only: how a staff member divides the week between office and home */
export type HybridSplit = 'days' | 'hours';
export type FlexKey = 'early_shift' | 'late_avail' | 'early_fridays' | 'reduced_week';
export type FlexTiming = 'round_year' | 'seasonal';
export type YesNo = 'yes' | 'no';

/** staff id → split (Hybrid) or true (WFH) */
export type ArrangementStaff = Record<string, HybridSplit | true>;

export interface WorkFlexModeState {
  offer: YesNo | null;
  arrangements: Record<ArrangementKey, ArrangementStaff>;
}

export interface WorkFlexFlexState {
  default: YesNo | null;
  /** Last timing picked (timing-based flexibilities only) */
  timing: FlexTiming | null;
  /** Non-timing flexibilities: per-staff override of `default` */
  perStaff: Record<string, YesNo>;
  /** Timing flexibilities: a staff member can be allowed in one timing only */
  perStaffByTiming: Record<FlexTiming, Record<string, YesNo>>;
}

export interface WorkFlexPreferences {
  modes: Record<FlexModeKey, WorkFlexModeState>;
  flex: Record<FlexKey, WorkFlexFlexState>;
  /** ISO date of the last save */
  savedAt: string | null;
  savedBy: string | null;
  /** Toggles changed since the last Submit (kept while switching modules) */
  unsubmitted?: boolean;
}

/** Staff list as the desktop builds it: active projects, shift converted from IST to the client time zone */
export interface WorkFlexStaff {
  id: string;
  name: string;
  designation: string;
  shift: string;
  tint: number;
}

export interface WorkFlexMode {
  key: FlexModeKey;
  title: string;
  question: string;
  icon: React.ElementType;
  tint: string;
}

export interface WorkFlexArrangement {
  key: ArrangementKey;
  name: string;
  desc: string;
  icon: React.ElementType;
  tint: string;
}

export interface WorkFlexItem {
  key: FlexKey;
  name: string;
  desc: string;
  icon: React.ElementType;
  tint: string;
  needsTiming: boolean;
}

export interface WorkFlexTiming {
  key: FlexTiming;
  tag: string;
  title: string;
  desc: string;
}

export const WORK_FLEX_CLIENT_TZ = 'EST';
/** Desktop converts IST shift times to America/New_York (EDT in October = IST − 9:30) */
const IST_TO_CLIENT_MINUTES = -570;
/** Shown on desktop as a static stat */
export const FLEX_ADOPTION_PCT = 83;

export const WORK_FLEX_MODES: WorkFlexMode[] = [
  {
    key: 'hyb',
    title: 'Hybrid Working',
    question: 'Would you like to offer Hybrid Working flexibility to your staff?',
    icon: Shuffle,
    tint: 'bg-[#F3E8FF] text-[#7E22CE]',
  },
  {
    key: 'wfh',
    title: 'Work From Home',
    question: 'Would you like to offer Work From Home flexibility to your staff?',
    icon: Home,
    tint: 'bg-[#DBEAFE] text-[#1D4ED8]',
  },
];

export const WORK_FLEX_ARRANGEMENTS: WorkFlexArrangement[] = [
  {
    key: 'permanent',
    name: 'Permanent',
    desc: 'Year-round — available to staff all the time, regardless of season.',
    icon: CalendarDays,
    tint: 'bg-[#E0E7FF] text-[#4338CA]',
  },
  {
    key: 'seasonal',
    name: 'Seasonal',
    desc: 'Peak / busy seasons only — tax season, audit season, or other peak periods.',
    icon: Sun,
    tint: 'bg-[#FEF3C7] text-[#B45309]',
  },
  {
    key: 'non_seasonal',
    name: 'Non-Seasonal',
    desc: 'Off-season periods only — outside the peak / busy windows.',
    icon: Moon,
    tint: 'bg-[#DBEAFE] text-[#1D4ED8]',
  },
  {
    key: 'on_request',
    name: 'Upon Request',
    desc: 'Approved per staff request — case-by-case, no fixed window.',
    icon: Clock,
    tint: 'bg-[#D1FAE5] text-[#047857]',
  },
];

export const WORK_FLEX_ITEMS: WorkFlexItem[] = [
  {
    key: 'early_shift',
    name: 'Early Shift Timing',
    desc: 'Please indicate your preference regarding early in / early out flexibility for your offshore staff during the off-season.',
    icon: Clock,
    tint: 'bg-[#FEF3C7] text-[#B45309]',
    needsTiming: false,
  },
  {
    key: 'late_avail',
    name: 'Occasional Late Availability',
    desc: 'If there is a requirement for a client call, team meeting, or any other business purpose outside of office hours, are you comfortable with your staff joining remotely from home using the laptop assigned to them?',
    icon: Moon,
    tint: 'bg-[#EDE9FE] text-[#6D28D9]',
    needsTiming: true,
  },
  {
    key: 'early_fridays',
    name: 'Early Fridays',
    desc: 'During the off-season, would you be open to allowing your staff to come in early and leave early on Fridays, giving them more time to spend with their families in the evening?',
    icon: CalendarCheck,
    tint: 'bg-[#FFE4E6] text-[#BE123C]',
    needsTiming: true,
  },
  {
    key: 'reduced_week',
    name: 'Reduced Workweek',
    desc: 'During the off-season, would you be open to allowing your staff to complete their committed hours from Monday to Thursday and take Fridays off?',
    icon: CalendarDays,
    tint: 'bg-[#D1FAE5] text-[#047857]',
    needsTiming: true,
  },
];

export const WORK_FLEX_TIMINGS: WorkFlexTiming[] = [
  { key: 'round_year', tag: 'Round the Year', title: 'All year, regardless of season', desc: 'Available any time it’s needed.' },
  { key: 'seasonal', tag: 'Non Seasonal', title: 'Off Season only', desc: 'Off-season periods only — outside the peak / busy windows.' },
];

/* --------------------------------- Staff --------------------------------- */

const toMinutes = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return null;
  const h = (Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0);
  return h * 60 + Number(m[2]);
};

const fromMinutes = (mins: number) => {
  const n = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(n / 60);
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(n % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

const toClientTime = (ist: string) => {
  const m = toMinutes(ist);
  return m === null ? ist : fromMinutes(m + IST_TO_CLIENT_MINUTES);
};

export const workFlexStaffFrom = (staff: ClientStaffMember[]): WorkFlexStaff[] =>
  [...staff]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s, tint) => ({ s, tint }))
    .filter(({ s }) => CURRENT_STAFF_STATUSES.includes(s.status))
    .map(({ s, tint }) => {
      const w = workInfoFor(s);
      return {
        id: s.id,
        name: s.name,
        designation: s.designation,
        shift: `${toClientTime(w.shiftFrom)} – ${toClientTime(w.shiftTo)}`,
        tint,
      };
    });

export const WORK_FLEX_STAFF = workFlexStaffFrom(MY_STAFF_SEED);

/** Work mode the client allowed a staff member in Staff Work Flexibility ('Hybrid' / 'WFH'); undefined = nothing chosen */
export const workModeFromPrefs = (prefs: WorkFlexPreferences, staffId: string): 'Hybrid' | 'WFH' | undefined => {
  const has = (key: FlexModeKey) => prefs.modes[key].offer !== 'no' && Object.values(prefs.modes[key].arrangements).some((a) => staffId in a);
  return has('wfh') ? 'WFH' : has('hyb') ? 'Hybrid' : undefined;
};

/* -------------------------------- Helpers -------------------------------- */

export const emptyArrangements = (): Record<ArrangementKey, ArrangementStaff> => ({
  permanent: {},
  seasonal: {},
  non_seasonal: {},
  on_request: {},
});

export const emptyFlexState = (): WorkFlexFlexState => ({
  default: null,
  timing: null,
  perStaff: {},
  perStaffByTiming: { round_year: {}, seasonal: {} },
});

export const modeStaffCount = (m: WorkFlexModeState) =>
  WORK_FLEX_ARRANGEMENTS.reduce((n, a) => n + Object.keys(m.arrangements[a.key]).length, 0);

/** Allowed staff per timing (timing flexibilities) or overall (others) */
export const flexCounts = (item: WorkFlexItem, f: WorkFlexFlexState, staff: WorkFlexStaff[]) => {
  if (item.needsTiming) {
    const byTiming = {} as Record<FlexTiming, number>;
    const allowed = new Set<string>();
    WORK_FLEX_TIMINGS.forEach((t) => {
      const ids = staff.filter((s) => f.perStaffByTiming[t.key]?.[s.id] === 'yes').map((s) => s.id);
      byTiming[t.key] = ids.length;
      ids.forEach((id) => allowed.add(id));
    });
    return { allowed: allowed.size, notAllowed: staff.length - allowed.size, byTiming };
  }
  const allowed = staff.filter((s) => (f.perStaff[s.id] ?? f.default) === 'yes').length;
  return { allowed, notAllowed: staff.length - allowed, byTiming: null };
};

export const answeredCount = (p: WorkFlexPreferences) =>
  WORK_FLEX_MODES.filter((m) => p.modes[m.key].offer !== null).length +
  WORK_FLEX_ITEMS.filter((f) => p.flex[f.key].default !== null).length;

export const WORK_FLEX_TOTAL_QUESTIONS = WORK_FLEX_MODES.length + WORK_FLEX_ITEMS.length;

export const formatFlexDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/* --------------------------------- Seed ---------------------------------- */

const ids = WORK_FLEX_STAFF.map((s) => s.id);

/** Previously saved preferences (desktop loads them from `tblclient_work_preferance`) */
export const WORK_FLEX_SEED: WorkFlexPreferences = {
  modes: {
    hyb: {
      offer: 'yes',
      arrangements: {
        ...emptyArrangements(),
        permanent: { [ids[0]]: 'days', [ids[1]]: 'hours' },
        seasonal: { [ids[2]]: 'days' },
      },
    },
    wfh: { offer: null, arrangements: emptyArrangements() },
  },
  flex: {
    early_shift: {
      ...emptyFlexState(),
      default: 'yes',
      perStaff: Object.fromEntries(ids.map((id, i) => [id, i === 3 || i === 4 ? 'no' : 'yes'])),
    },
    late_avail: {
      ...emptyFlexState(),
      default: 'yes',
      timing: 'round_year',
      perStaffByTiming: { round_year: { [ids[0]]: 'yes', [ids[1]]: 'yes' }, seasonal: { [ids[2]]: 'yes' } },
    },
    early_fridays: emptyFlexState(),
    reduced_week: emptyFlexState(),
  },
  savedAt: '2026-10-08',
  savedBy: 'Jamie Brooks',
};
