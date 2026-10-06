import { BRANCHES, TEAM_REPORTING_MANAGERS } from './teamAttendanceData';
import type { MyProfileData } from './profileData';

/** My Team (Manager only): everyone in the manager's hierarchy */

export const STAFF_STATUSES = ['Active', 'Sabbatical Leave', 'Notice', 'Red Flag', 'Maternity'] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export const TEAM_ROLES = ['Associate', 'Senior Associate', 'Team Lead', 'Assistant Manager', 'Manager', 'Assistant Vice President'];

export interface PastReview {
  id: string;
  cycle: string;
  submittedOn: string; // ISO
  reviewer: string;
  /** Overall rating out of 5 */
  rating: number;
  summary: string;
}

/** Available / total days for one leave type */
export interface LeaveBalance {
  available: number;
  total: number;
}

export interface MemberLeaves {
  pto: LeaveBalance;
  ot: LeaveBalance;
  additional: LeaveBalance;
}

export interface TeamMemberRecord {
  staffName: string;
  staffCode: string;
  email: string;
  branch: string;
  reportingManager: string;
  joiningDate: string; // ISO
  status: StaffStatus;
  role: string;
  /** Annual CTC in INR — only shown after the manager verifies their password */
  ctc: number;
  availableFte: number;
  leaves: MemberLeaves;
  pastReviews: PastReview[];
}

/** "Total Leaves" on the card: everything still available */
export const totalLeavesOf = (m: Pick<TeamMemberRecord, 'leaves'>) =>
  m.leaves.pto.available + m.leaves.ot.available + m.leaves.additional.available;

const lv = (pto: [number, number], ot: [number, number] = [0, 0], additional: [number, number] = [0, 0]): MemberLeaves => ({
  pto: { available: pto[0], total: pto[1] },
  ot: { available: ot[0], total: ot[1] },
  additional: { available: additional[0], total: additional[1] },
});

export const MY_TEAM_BRANCHES = BRANCHES;

const email = (name: string) => `${name.toLowerCase().replace(/\s+/g, '.')}@my-cpe.com`;

// Per-person HR details (everything else comes from the reporting hierarchy)
const DETAILS: Record<string, Omit<TeamMemberRecord, 'staffName' | 'staffCode' | 'email' | 'branch' | 'reportingManager' | 'pastReviews'>> = {
  'John Smith': { joiningDate: '2024-12-02', status: 'Active', role: 'Team Lead', ctc: 1140000, availableFte: 1, leaves: lv([9, 12], [0, 0], [0, 0]) },
  'Ananya Kulkarni': { joiningDate: '2023-06-14', status: 'Active', role: 'Senior Associate', ctc: 820000, availableFte: 1, leaves: lv([4.5, 12], [2, 4]) },
  'Vikram Rao': { joiningDate: '2025-02-10', status: 'Active', role: 'Associate', ctc: 540000, availableFte: 0.5, leaves: lv([4, 6]) },
  'Kunal Desai': { joiningDate: '2022-09-01', status: 'Notice', role: 'Senior Associate', ctc: 880000, availableFte: 0, leaves: lv([2, 12]) },
  'Nidhi Purohit': { joiningDate: '2024-03-18', status: 'Maternity', role: 'Associate', ctc: 600000, availableFte: 0, leaves: lv([0, 12], [0, 0], [0, 26]) },
  'Pooja Bhatt': { joiningDate: '2025-07-21', status: 'Active', role: 'Associate', ctc: 480000, availableFte: 1, leaves: lv([5, 5], [0, 0], [2, 2]) },
  'Rohan Mehta': { joiningDate: '2021-11-08', status: 'Red Flag', role: 'Team Lead', ctc: 1260000, availableFte: 0.75, leaves: lv([1.5, 12], [2, 2]) },
  'Sneha Joshi': { joiningDate: '2023-01-16', status: 'Sabbatical Leave', role: 'Senior Associate', ctc: 790000, availableFte: 0, leaves: lv([0, 12]) },
  'Farhan Shaikh': { joiningDate: '2026-06-26', status: 'Active', role: 'Associate', ctc: 450000, availableFte: 1, leaves: lv([9.5, 9.5]) },
};

// Reporting managers also sit under the signed-in manager
const MANAGER_DETAILS: Record<string, { code: string; branch: string; joiningDate: string; ctc: number; role: string }> = {
  'Aryan Sharma': { code: 'A01980', branch: 'Atulyaksh - Ahmedabad', joiningDate: '2019-04-05', ctc: 2150000, role: 'Manager' },
  'Meera Iyer': { code: 'A02104', branch: 'Sadra - Surat', joiningDate: '2020-01-13', ctc: 1980000, role: 'Manager' },
};

const reviewsFor = (name: string, reviewer: string, joiningDate: string): PastReview[] => {
  const all: PastReview[] = [
    {
      id: `${name}-fy25`,
      cycle: 'April 2024 - March 2025',
      submittedOn: '2025-04-22',
      reviewer,
      rating: 4,
      summary: 'Consistent delivery and strong client feedback; encouraged to mentor newer team members.',
    },
    {
      id: `${name}-fy24`,
      cycle: 'April 2023 - March 2024',
      submittedOn: '2024-04-18',
      reviewer,
      rating: 3.5,
      summary: 'Good technical growth through the year; time management during busy season can improve.',
    },
  ];
  // Only reviews submitted after they joined
  return all.filter((r) => r.submittedOn > joiningDate);
};

export const MY_TEAM_SEED: TeamMemberRecord[] = [
  ...TEAM_REPORTING_MANAGERS.flatMap((m) =>
    m.members.map((x) => {
      const d = DETAILS[x.staffName];
      return {
        staffName: x.staffName,
        staffCode: x.staffCode,
        email: email(x.staffName),
        branch: x.branch,
        reportingManager: m.name,
        ...d,
        pastReviews: reviewsFor(x.staffName, m.name, d.joiningDate),
      };
    })
  ),
  ...Object.entries(MANAGER_DETAILS).map(([name, d]) => ({
    staffName: name,
    staffCode: d.code,
    email: email(name),
    branch: d.branch,
    reportingManager: 'Naveen Das',
    joiningDate: d.joiningDate,
    status: 'Active' as StaffStatus,
    role: d.role,
    ctc: d.ctc,
    availableFte: 1,
    leaves: lv([5, 12], [1, 1]),
    pastReviews: reviewsFor(name, 'Naveen Das', d.joiningDate),
  })),
];

/** Reporting managers a member can be moved under */
export const MY_TEAM_MANAGERS = ['Naveen Das', ...TEAM_REPORTING_MANAGERS.map((m) => m.name).filter((n) => n !== 'Naveen Das')];

/** ₹ 11,40,000 */
export const formatCtc = (n: number) => `₹ ${n.toLocaleString('en-IN')}`;

/**
 * Profile the manager edits from "Edit Details". HR fields come from the team record;
 * the signed-in user's own details are never copied onto someone else.
 */
export const profileForMember = (m: TeamMemberRecord, base: MyProfileData): MyProfileData => {
  const city = m.branch.split(' - ').pop() ?? '';
  const mobile = `98${m.staffCode.replace(/\D/g, '').padStart(8, '0')}`.slice(0, 10);
  return {
    values: {
      ...base.values,
      employeeId: m.staffCode,
      fullName: m.staffName,
      officialEmail: m.email,
      designation: m.role,
      reportingManager: m.reportingManager,
      joiningDate: m.joiningDate,
      location: city ? `${city}, India` : '',
      mobile,
      personalEmail: '',
      dob: '',
      guardianInstead: 'No',
      fatherName: '',
      fatherDob: '',
      fatherPhone: '',
      fatherInsurance: false,
      motherName: '',
      motherDob: '',
      motherPhone: '',
      motherInsurance: false,
      maritalStatus: '',
      introVideoType: '',
      introVideoName: '',
      introVideoUrl: '',
      introVideoAddedOn: '',
    },
    lists: { software: [], technicalSkills: [], familyMembers: [], qualifications: [], experiences: [] },
  };
};
