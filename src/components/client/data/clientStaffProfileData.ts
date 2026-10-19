/**
 * Mock data for the staff details tabs (desktop `templates/projects/*.tpl`: work_information, mapped_contacts,
 * attendance-leave, skills_qualification, employee_document, term_of_document, training_development,
 * system_details, assessments_tab, sop_tab). Generated per staff so every profile has data.
 */
import type { ThreadComment } from '../../../types/comments';
import type { ClientStaffMember } from './clientStaffData';

/** Stable pseudo-random number 0..1 for a key */
const rand = (key: string) => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
};
const pick = <T,>(list: readonly T[], key: string) => list[Math.floor(rand(key) * list.length)];
const num = (id: string) => Number(id.replace(/\D/g, '')) || 1;
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shift = (isoDate: string, days: number) => {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return iso(d);
};

/** Last day with records: the last working day for staff who already left, otherwise today */
export const staffRecordsEnd = (s: ClientStaffMember) => {
  const today = iso(new Date());
  return s.lastWorkingDay && s.lastWorkingDay < today ? s.lastWorkingDay : today;
};
/** Inside the staff member's employment (joining date → last working day / today) */
const employedOn = (s: ClientStaffMember, date: string) => date >= s.joiningDate && date <= staffRecordsEnd(s);

/* ---------------------------- Work Information ---------------------------- */

export type StaffWorkMode = 'Office' | 'WFH' | 'Hybrid';

export interface StaffWorkInfo {
  department: string;
  reportingManager: string;
  employmentStartDate: string;
  currentMode: StaffWorkMode;
  shiftFrom: string;
  shiftTo: string;
}

const MANAGERS = ['Gaurav Bansal', 'Kavya Reddy', 'Manav Saxena', 'Dev Malhotra'];

export const workInfoFor = (s: ClientStaffMember): StaffWorkInfo => {
  const dept = /tax/i.test(s.designation) ? 'Tax' : /audit/i.test(s.designation) ? 'Audit & Assurance' : 'Accounting & Bookkeeping';
  const manager = MANAGERS.find((m) => m !== s.name && rand(s.id + m) > 0.3) ?? MANAGERS[0];
  return {
    department: dept,
    reportingManager: manager,
    employmentStartDate: s.joiningDate,
    currentMode: pick(['Office', 'Office', 'Hybrid', 'WFH'] as const, `${s.id}mode`),
    shiftFrom: pick(['09:00 AM', '10:00 AM', '08:30 AM'], `${s.id}from`),
    shiftTo: pick(['05:00 PM', '06:00 PM', '05:30 PM'], `${s.id}to`),
  };
};

/* ------------------------------- Reporting To ------------------------------ */

export interface MappedContact {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  phone: string;
  email: string;
  /** ISO date, optional */
  birthDate: string;
  status: 'Active' | 'Inactive';
}

const CLIENT_CONTACTS = [
  { firstName: 'Taylor', lastName: 'Morgan', designation: 'Managing Partner' },
  { firstName: 'Riley', lastName: 'Brooks', designation: 'Tax Manager' },
  { firstName: 'Casey', lastName: 'Turner', designation: 'Audit Senior Manager' },
  { firstName: 'Morgan', lastName: 'Lee', designation: 'Accounting Supervisor' },
];

export const mappedContactsFor = (s: ClientStaffMember): MappedContact[] => {
  const n = num(s.id);
  return CLIENT_CONTACTS.filter((_, i) => i === 0 || (n + i) % 3 === 0).map((c, i) => ({
    id: `${s.id}-mc${i}`,
    ...c,
    phone: `+1 (555) 01${i}-${String(1000 + n * 37 + i * 7).slice(-4)}`,
    email: `${c.firstName.toLowerCase()}@northwindcpa.example`,
    birthDate: '',
    status: i === 2 ? 'Inactive' : 'Active',
  }));
};

/* ---------------------------- Attendance & Leave --------------------------- */

export type AttendanceStatus = 'Full day' | 'Half Day' | 'Absent' | 'Half PL' | 'WO' | 'PL' | 'Holiday';

/** Desktop status filter order */
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['Absent', 'Full day', 'Half Day', 'Half PL', 'WO', 'PL', 'Holiday'];

export interface AttendanceDay {
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  officeTime: string | null;
  breakTime: string | null;
  overtime: string | null;
  workMode: 'Office' | 'WFH' | null;
}

const HOLIDAYS: Record<string, string> = {
  '2025-08-15': 'Independence Day',
  '2025-10-02': 'Gandhi Jayanti',
  '2025-10-20': 'Diwali',
  '2025-10-22': 'New Year (Gujarati)',
  '2025-12-25': 'Christmas',
  '2026-01-26': 'Republic Day',
  '2026-03-04': 'Holi',
  '2026-08-15': 'Independence Day',
  '2026-10-02': 'Gandhi Jayanti',
  '2026-10-20': 'Dussehra',
  '2026-11-09': 'Diwali',
  '2026-11-10': 'New Year (Gujarati)',
  '2026-12-25': 'Christmas',
};

const hm = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
const clock = (mins: number) => {
  const h = Math.floor(mins / 60);
  return `${pad(((h + 11) % 12) + 1)}:${pad(mins % 60)} ${h < 12 ? 'AM' : 'PM'}`;
};

/** Daily attendance for one month (joining date → last working day / today), newest first */
export const attendanceFor = (s: ClientStaffMember, year: number, month: number, mode: StaffWorkMode): AttendanceDay[] => {
  const days: AttendanceDay[] = [];
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const date = `${year}-${pad(month + 1)}-${pad(d)}`;
    if (!employedOn(s, date)) continue;
    const weekday = new Date(year, month, d).getDay();
    const r = rand(s.id + date);
    let status: AttendanceStatus = 'Full day';
    if (HOLIDAYS[date]) status = 'Holiday';
    else if (weekday === 0 || weekday === 6) status = 'WO';
    else if (r < 0.03) status = 'Absent';
    else if (r < 0.08) status = 'PL';
    else if (r < 0.11) status = 'Half PL';
    else if (r < 0.14) status = 'Half Day';
    const worked = status === 'Full day' || status === 'Half Day' || status === 'Half PL';
    const inMins = 9 * 60 + Math.floor(rand(date + s.id + 'in') * 40) - 10;
    const office = status === 'Full day' ? 8 * 60 + 30 + Math.floor(rand(date + 'o' + s.id) * 75) : 4 * 60 + Math.floor(rand(date + 'h') * 40);
    const breakMins = 30 + Math.floor(rand(date + 'b' + s.id) * 35);
    const ot = Math.max(0, office - breakMins - 8 * 60);
    days.push({
      date,
      status,
      checkIn: worked ? clock(inMins) : null,
      checkOut: worked ? clock(inMins + office) : null,
      officeTime: worked ? hm(office) : null,
      breakTime: worked ? hm(breakMins) : null,
      overtime: worked && ot > 0 ? hm(ot) : worked ? '00:00' : null,
      workMode: worked ? (mode === 'Hybrid' ? (weekday % 2 ? 'Office' : 'WFH') : mode === 'WFH' ? 'WFH' : 'Office') : null,
    });
  }
  return days.reverse();
};

export const holidayName = (date: string) => HOLIDAYS[date];

export interface AttendanceSummary {
  working: number;
  present: number;
  absent: number;
  leave: number;
  holidays: number;
  total: number;
  salary: number;
}

/** Desktop KPI math (attendance-leave.tpl) */
export const summarizeAttendance = (days: AttendanceDay[]): AttendanceSummary => {
  const count = (st: AttendanceStatus) => days.filter((d) => d.status === st).length;
  const present = count('Full day');
  const absent = count('Absent');
  const leave = count('Half Day') + count('Half PL') + count('PL');
  const holidays = count('Holiday');
  return { working: present + absent + leave, present, absent, leave, holidays, total: present + leave, salary: present + leave };
};

export interface LeaveBalance {
  label: 'PTO Leaves' | 'OT Leaves' | 'Additional Leave';
  used: number;
  balance: number;
}

export interface LeaveDeduction {
  date: string;
  days: number;
  deductedFrom: string;
}

export interface LeaveRecord {
  id: string;
  startDate: string;
  endDate: string;
  leaveType: 'Paid Leave' | 'Half Paid Leave' | 'Sick Leave' | 'Unpaid Leave';
  reason: string;
  deductedFrom: string;
  appliedOn: string;
  deductions: LeaveDeduction[];
}

/** Used days add up the leaves listed below (same deductions), so the cards and the list agree */
export const leaveBalancesFor = (s: ClientStaffMember): LeaveBalance[] => {
  const n = num(s.id);
  const usedFrom = (from: string) =>
    leavesFor(s).reduce((sum, l) => sum + l.deductions.filter((d) => d.deductedFrom === from).reduce((t, d) => t + d.days, 0), 0);
  const ot = usedFrom('OT Leave');
  return [
    { label: 'PTO Leaves', used: usedFrom('PTO'), balance: 18 },
    { label: 'OT Leaves', used: ot, balance: Math.max(ot, 2 + (n % 4)) },
    { label: 'Additional Leave', used: n % 2, balance: 2 },
  ];
};

const LEAVE_REASONS = ['Family function', 'Not feeling well', 'Personal work', 'Traveling to hometown', 'Medical appointment', 'Festival with family'];

export const leavesFor = (s: ClientStaffMember): LeaveRecord[] => {
  const n = num(s.id);
  const starts = ['2026-09-29', '2026-08-21', '2026-07-06', '2026-05-18', '2026-03-23', '2025-12-15', '2025-11-03'].filter((d) =>
    employedOn(s, shift(d, 2)) && employedOn(s, shift(d, -12)),
  );
  return starts.slice(0, 3 + (n % 3)).map((start, i) => {
    const days = 1 + ((n + i) % 3);
    const type = pick(['Paid Leave', 'Paid Leave', 'Sick Leave', 'Half Paid Leave', 'Unpaid Leave'] as const, s.id + start);
    const half = type === 'Half Paid Leave';
    const end = half ? start : shift(start, days - 1);
    const from = type === 'Unpaid Leave' ? 'LWP' : i % 3 === 2 ? 'OT Leave' : 'PTO';
    return {
      id: `${s.id}-lv${i}`,
      startDate: start,
      endDate: end,
      leaveType: type,
      reason: pick(LEAVE_REASONS, s.id + 'r' + i),
      deductedFrom: from,
      appliedOn: shift(start, -(3 + i * 2)),
      deductions: Array.from({ length: half ? 1 : days }, (_, k) => ({ date: shift(start, k), days: half ? 0.5 : 1, deductedFrom: from })),
    };
  });
};

/* -------------------------- Skills & Qualification ------------------------- */

export interface StaffCertificate {
  name: string;
  type: 'Licensed' | 'Others';
  status: 'Completed' | 'In Progress' | 'Pursuing';
}

export interface StaffSkills {
  technical: string[];
  software: string[];
  education: string[];
  certificates: StaffCertificate[];
}

const TECH_SKILLS = ['Individual Tax (1040)', 'Business Tax (1120/1120S)', 'Partnership Tax (1065)', 'Bookkeeping', 'Bank Reconciliation', 'Payroll Processing', 'Financial Statements', 'Audit Workpapers', 'Sales Tax', 'Trust Tax (1041)'];
const SOFTWARE = ['CCH Axcess', 'Drake', 'UltraTax CS', 'Lacerte', 'QuickBooks Online', 'Xero', 'FreshBooks', 'MS Excel', 'CaseWare', 'Karbon'];

export const skillsFor = (s: ClientStaffMember): StaffSkills => {
  const n = num(s.id);
  const take = (list: string[], count: number, salt: string) =>
    [...list].sort((a, b) => rand(salt + a) - rand(salt + b)).slice(0, count);
  return {
    technical: take(TECH_SKILLS, 4 + (n % 3), s.id + 't'),
    software: take(SOFTWARE, 3 + (n % 3), s.id + 's'),
    education: n % 2 ? ['M.Com — Gujarat University (2019)', 'B.Com — Gujarat University (2017)'] : ['B.Com — Saurashtra University (2018)'],
    certificates:
      n % 3 === 0
        ? []
        : [
            { name: n % 2 ? 'CPA (US) — Part qualified' : 'Enrolled Agent (EA)', type: 'Licensed', status: n % 2 ? 'Pursuing' : 'Completed' },
            { name: 'QuickBooks ProAdvisor', type: 'Others', status: 'Completed' },
          ],
  };
};

/* ---------------------------- Employee Documents --------------------------- */

export type StaffDocumentGroup = 'Employee Document' | 'Government Documents' | 'Background Verification';

export interface StaffDocument {
  id: string;
  group: StaffDocumentGroup;
  name: string;
  fileName: string;
  verified: boolean;
}

export const documentsFor = (s: ClientStaffMember): StaffDocument[] => {
  const slug = s.name.toLowerCase().replace(/\s+/g, '_');
  const n = num(s.id);
  const verified = n % 4 !== 0;
  const doc = (group: StaffDocumentGroup, name: string, fileName: string, v = verified): StaffDocument => ({
    id: `${s.id}-${name}`,
    group,
    name,
    fileName,
    verified: v,
  });
  const joinYear = Number(s.joiningDate.slice(0, 4));
  return [
    doc('Employee Document', 'Offer Letter', `offer_letter_${slug}.pdf`),
    doc('Employee Document', 'Employment Letter', `employment_letter_${slug}.pdf`),
    ...(n % 3 === 0 ? [doc('Employee Document', 'Addendum Letter', `addendum_${slug}.pdf`)] : []),
    ...(joinYear < 2026 ? [doc('Employee Document', 'Appraisal Letter', `Appraisal_04-${joinYear + 1}`, false)] : []),
    ...(joinYear < 2025 ? [doc('Employee Document', 'Appraisal Letter', `Appraisal_04-${joinYear + 2}`, false)] : []),
    ...(n % 2 ? [doc('Employee Document', 'Work From Home Agreement', 'WFH Terms & Condition pdf', false), doc('Employee Document', 'AI Usage Declaration', 'AI Usage Declaration', false)] : []),
    doc('Government Documents', 'Aadhaar card', `aadhar_${slug}.pdf`),
    doc('Government Documents', 'Pan Card', `pan_${slug}.pdf`),
    ...(n % 2 === 0 ? [doc('Government Documents', 'Passport', `passport_${slug}.pdf`)] : []),
    doc('Government Documents', 'Form No. 11', `form11_${slug}.pdf`),
    doc('Government Documents', 'PF Declaration', `pf_declaration_${slug}.pdf`),
    doc('Background Verification', 'Employee Check', `employee_check_${slug}.pdf`, true),
    doc('Background Verification', 'Criminal Check', `criminal_check_${slug}.pdf`, true),
    ...(n % 3 !== 1 ? [doc('Background Verification', 'Credit Check', `credit_check_${slug}.pdf`, n % 2 === 0)] : []),
  ];
};

/* --------------------------- Terms of Employment --------------------------- */

export interface StaffTerms {
  noticePeriod: string;
  probationPeriod: string | null;
  minimumEmploymentPeriod: string;
  employmentStartDate: string;
  joiningBonus: string | null;
  buyOutNoticePeriod: string | null;
  nextAppraisalDate: string;
  baseLocation: string;
  branchName: string;
  otAvailability: string;
  employmentType: string;
  availableUpTo: string;
  taxSeasonAvailableUpTo: string;
}

export const termsFor = (s: ClientStaffMember): StaffTerms => {
  const n = num(s.id);
  const nextYear = new Date().getFullYear() + (new Date().getMonth() >= 3 ? 1 : 0);
  return {
    noticePeriod: `${n % 2 ? 2 : 3} Months`,
    probationPeriod: n % 3 === 0 ? null : '3 Months',
    minimumEmploymentPeriod: `${1 + (n % 2)} Years`,
    employmentStartDate: s.joiningDate,
    joiningBonus: n % 4 === 0 ? (25000).toFixed(2) : null,
    buyOutNoticePeriod: n % 3 === 1 ? (40000 + n * 1000).toFixed(2) : null,
    nextAppraisalDate: `${nextYear}-04-01`,
    baseLocation: s.location,
    branchName: `${s.location} - ${pick(['City Center', 'Tech Park', 'Main Road', 'Business Bay'], s.id + 'b')}`,
    otAvailability: pick(['OT Round the Year', 'OT Seasonal', 'Not Available'], s.id + 'ot'),
    employmentType: s.engagementType === 'Seasonal Staffing' ? 'Contract' : 'Full Time',
    availableUpTo: pick(['11:00 AM', '12:00 PM', '01:00 PM'], s.id + 'au'),
    taxSeasonAvailableUpTo: pick(['01:00 PM', '02:00 PM', '03:00 PM'], s.id + 'tau'),
  };
};

/* ------------------------- Training & Development -------------------------- */

export type TrainingType = 'PTC' | 'Live Webinar' | 'Self Study' | 'Certification Programs';
export const TRAINING_TYPES: TrainingType[] = ['PTC', 'Live Webinar', 'Self Study', 'Certification Programs'];

export interface TrainingRecord {
  id: string;
  name: string;
  type: TrainingType;
  duration: string;
  startDate: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
}

const TRAININGS: [string, TrainingType, string][] = [
  ['Individual Tax Return Preparation — 2026 Updates', 'Live Webinar', '2 Hrs'],
  ['Partnership Taxation Essentials', 'PTC', '16 Hrs'],
  ['QuickBooks Online Advanced Reporting', 'Self Study', '4 Hrs'],
  ['Ethics for CPAs', 'Live Webinar', '4 Hrs'],
  ['US GAAP Fundamentals', 'Certification Programs', '24 Hrs'],
  ['Excel for Accountants: Power Query', 'Self Study', '3 Hrs'],
  ['Audit Sampling Techniques', 'PTC', '8 Hrs'],
  ['Communication Skills for Offshore Teams', 'Live Webinar', '1 Hr'],
];

export const trainingsFor = (s: ClientStaffMember): TrainingRecord[] => {
  const n = num(s.id);
  const end = staffRecordsEnd(s);
  return TRAININGS.filter((_, i) => (i + n) % 4 !== 0)
    .map(([name, type, duration], i) => {
      const start = shift(end, -(6 + i * 23 + n));
      const status: TrainingRecord['status'] = i === 0 ? 'Not Started' : i === 1 ? 'In Progress' : 'Completed';
      return { id: `${s.id}-tr${i}`, name, type, duration, startDate: start, status };
    })
    .filter((t) => t.startDate >= s.joiningDate);
};

/* -------------------------- System & IT Details ---------------------------- */

export interface AssignedDevice {
  id: string;
  assetCode: string;
  assetGroup: string;
  deskNo: string;
  brand: string;
  assignedOn: string;
  status: 'Assigned' | 'Returned';
}

export interface SystemAccess {
  id: string;
  software: string;
  email: string;
  assignedOn: string;
  status: 'Active' | 'Revoked';
}

export const devicesFor = (s: ClientStaffMember): AssignedDevice[] => {
  const n = num(s.id);
  const inactive = s.status === 'Inactive';
  return [
    ['Laptop', pick(['Dell', 'Lenovo', 'HP'], s.id + 'l')],
    ['Monitor', pick(['Dell', 'LG', 'Samsung'], s.id + 'm')],
    ['Headset', pick(['Jabra', 'Logitech'], s.id + 'h')],
    ...(n % 2 ? [['Keyboard & Mouse', 'Logitech']] : []),
  ].map(([group, brand], i) => ({
    id: `${s.id}-dv${i}`,
    assetCode: `ENT-${group.slice(0, 3).toUpperCase()}-${pad(n)}${300 + i * 7}`,
    assetGroup: group,
    deskNo: `${s.location.slice(0, 3).toUpperCase()}-${pad(10 + n)}`,
    brand,
    assignedOn: shift(s.joiningDate, i),
    status: inactive ? 'Returned' : 'Assigned',
  }));
};

export const systemAccessFor = (s: ClientStaffMember): SystemAccess[] => {
  const inactive = s.status === 'Inactive';
  return ['Microsoft 365', 'CCH Axcess', 'QuickBooks Online', 'Karbon', 'LastPass'].slice(0, 3 + (num(s.id) % 3)).map((software, i) => ({
    id: `${s.id}-sa${i}`,
    software,
    email: i === 0 ? s.email : `${s.name.split(' ')[0].toLowerCase()}@northwindcpa.example`,
    assignedOn: shift(s.joiningDate, 1 + i * 2),
    status: inactive ? 'Revoked' : 'Active',
  }));
};

/* ------------------------------- Assessments ------------------------------- */

export interface AssessmentRecord {
  id: string;
  name: string;
  /** Percentage; null while pending */
  score: number | null;
  assignedBy: string;
  assignedOn: string;
  completedOn: string | null;
}

const ASSESSMENTS = ['Individual Tax Assessment', 'Bookkeeping Fundamentals', 'MS Excel Proficiency', 'Business Communication', 'Audit Basics'];

export const ASSESSMENT_NAMES = ASSESSMENTS;

export const assessmentsFor = (s: ClientStaffMember): AssessmentRecord[] => {
  const n = num(s.id);
  const end = staffRecordsEnd(s);
  return ASSESSMENTS.filter((_, i) => (i + n) % 3 !== 0).map((name, i) => {
    const assigned = shift(end, -(8 + i * 41 + n * 2));
    const pending = i === 0 && n % 2 === 0;
    return {
      id: `${s.id}-as${i}`,
      name,
      score: pending ? null : 55 + Math.floor(rand(s.id + name) * 43),
      assignedBy: i % 2 ? 'Riley Brooks' : 'Taylor Morgan',
      assignedOn: assigned,
      completedOn: pending ? null : shift(assigned, 2 + (i % 4)),
    };
  }).filter((a) => a.assignedOn >= s.joiningDate);
};

/* ----------------------------------- SOP ----------------------------------- */

/** Desktop `getSOPStatusData`; once decided the status locks */
export type SopStatus = 'Pending' | 'Approved' | 'Rejected' | 'Not Required';
export const SOP_DECISIONS: Exclude<SopStatus, 'Pending'>[] = ['Approved', 'Rejected', 'Not Required'];

export interface SopRecord {
  id: string;
  name: string;
  /** 'document' = uploaded file, 'ai' = AI Powered SOP from a video */
  kind: 'document' | 'ai';
  fileName: string;
  status: SopStatus;
  decidedOn: string | null;
  decidedBy: string | null;
  createdBy: string;
  /** Created by this client contact (can delete / publish) */
  createdByMe: boolean;
  published: boolean;
  processing: 'completed' | 'processing';
  aiSteps?: number;
  feedback: ThreadComment[];
}

export const sopsFor = (s: ClientStaffMember): SopRecord[] => {
  const n = num(s.id);
  return [
    {
      id: `${s.id}-sop1`,
      name: 'Monthly Bank Reconciliation',
      kind: 'document' as const,
      fileName: 'bank_reconciliation_sop.pdf',
      status: 'Approved' as const,
      decidedOn: '2026-08-12',
      decidedBy: 'Taylor Morgan',
      createdBy: s.name,
      createdByMe: false,
      published: false,
      processing: 'completed' as const,
      feedback: [
        { id: 'c1', author: 'Taylor Morgan', role: 'Manager' as const, text: 'Looks good. Please add the step for uncleared cheques.', createdAt: '2026-08-11T15:20:00' },
        { id: 'c2', author: s.name, role: 'Staff' as const, text: 'Added the uncleared cheques step in section 4.', createdAt: '2026-08-12T10:05:00' },
      ],
    },
    {
      id: `${s.id}-sop2`,
      name: 'Client Onboarding Checklist',
      kind: 'document' as const,
      fileName: 'client_onboarding_checklist.docx',
      status: 'Pending' as const,
      decidedOn: null,
      decidedBy: null,
      createdBy: s.name,
      createdByMe: false,
      published: false,
      processing: 'completed' as const,
      feedback: [],
    },
    {
      id: `${s.id}-sop3`,
      name: 'Posting Payroll Journal in QBO',
      kind: 'ai' as const,
      fileName: 'payroll_journal_walkthrough.mp4',
      status: 'Pending' as const,
      decidedOn: null,
      decidedBy: null,
      createdBy: 'Taylor Morgan',
      createdByMe: true,
      published: n % 2 === 0,
      processing: 'completed' as const,
      aiSteps: 9,
      feedback: [],
    },
  ];
};

export const SOP_DOC_FORMATS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'];
export const SOP_VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi'];
