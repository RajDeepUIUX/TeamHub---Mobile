/** Mock data for Human Resources → My Staff (desktop `projects` controller, My Staff list + staff profile) */

export type ClientStaffStatus =
  | 'Active'
  | 'On Notice'
  | 'Offboarding In-Progress'
  | 'Replacement In-Progress'
  | 'Inactive';

export const CLIENT_STAFF_STATUSES: ClientStaffStatus[] = [
  'Active',
  'On Notice',
  'Offboarding In-Progress',
  'Replacement In-Progress',
  'Inactive',
];

/** Dummy hourly rate per level (USD) — desktop "Rate/hr" column (`project_cost`), shared with Invoices */
export const STAFF_RATE_BY_LEVEL: Record<string, number> = {
  'Level 1': 8.5,
  'Level 2': 9.75,
  'Level 3': 12.25,
  'Level 4': 15.5,
  'Level 5': 19.0,
};
export const hourlyRateOf = (member: Pick<ClientStaffMember, 'level'>) => STAFF_RATE_BY_LEVEL[member.level] ?? 12;

/** Desktop default status filter: everyone except Inactive */
export const CURRENT_STAFF_STATUSES: ClientStaffStatus[] = CLIENT_STAFF_STATUSES.filter((s) => s !== 'Inactive');

export interface ClientStaffMember {
  id: string;
  name: string;
  employeeCode: string;
  email: string;
  level: string;
  designation: string;
  /** ISO date (yyyy-mm-dd) */
  joiningDate: string;
  /** Empty on desktop for most staff */
  engagementType: string | null;
  location: string;
  /** Committed hours per week */
  committedHours: number;
  /** Additional availability (hrs per week); null shows "--" */
  additionalAvailability: number | null;
  status: ClientStaffStatus;
  /** Last working day for On Notice / Offboarding staff (ISO) */
  lastWorkingDay?: string;
  // Personal Information tab
  gender: 'Male' | 'Female';
  /** ISO date */
  dateOfBirth: string;
  nationality: string;
  maritalStatus: 'Single' | 'Married';
  currentCity: string;
  permanentAddress: string;
  correspondenceAddress: string;
  timeZone: string;
}

const emailFor = (name: string) => `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

const FEMALE_NAMES = ['Ananya', 'Charvi', 'Heena', 'Isha', 'Kavya', 'Priti', 'Zara'];
const pad = (n: number) => String(n).padStart(2, '0');
const PIN_CODES: Record<string, string> = { Ahmedabad: '380054', Rajkot: '360005', Gandhinagar: '382010', Vadodara: '390007', Surat: '395007' };

const seed = (
  id: number,
  name: string,
  level: number,
  designation: string,
  joiningDate: string,
  location: string,
  status: ClientStaffStatus,
  extra: Partial<ClientStaffMember> = {},
): ClientStaffMember => ({
  id: `ms${id}`,
  name,
  employeeCode: `ENT-${1000 + id * 7}`,
  email: emailFor(name),
  level: `Level ${level}`,
  designation,
  joiningDate,
  engagementType: null,
  location,
  committedHours: 40,
  additionalAvailability: null,
  status,
  gender: FEMALE_NAMES.includes(name.split(' ')[0]) ? 'Female' : 'Male',
  dateOfBirth: `${1988 + (id % 10)}-${pad(((id * 5) % 12) + 1)}-${pad(((id * 7) % 28) + 1)}`,
  nationality: 'Indian',
  maritalStatus: id % 3 === 0 ? 'Married' : 'Single',
  currentCity: location,
  permanentAddress: `${10 + id * 3}, Green Park Society, Main Road, ${location} ${PIN_CODES[location] ?? ''}`.trim(),
  correspondenceAddress: `B-${100 + id * 11}, Lake View Apartments, Nr. Central Park, ${location} ${PIN_CODES[location] ?? ''}`.trim(),
  timeZone: 'EST',
  ...extra,
});

export const MY_STAFF_SEED: ClientStaffMember[] = [
  seed(1, 'Aarav Mehta', 4, 'Team Lead - Accounting', '2024-03-31', 'Ahmedabad', 'Active', {
    dateOfBirth: '1995-02-20',
    maritalStatus: 'Single',
    permanentAddress: '12, Sunrise Colony, Station Road, Udaipur 313001',
    correspondenceAddress: 'B-204, Lake View Apartments, Nr. Central Park, Ahmedabad 380054',
  }),
  seed(2, 'Arnav Joshi', 3, 'Specialist - Tax Accountant', '2023-01-01', 'Ahmedabad', 'On Notice', { lastWorkingDay: '2026-11-15' }),
  seed(3, 'Aditya Rao', 4, 'Team Lead - Supervisor - Tax Reviewer', '2023-11-26', 'Ahmedabad', 'On Notice', { lastWorkingDay: '2026-11-30' }),
  seed(4, 'Ananya Iyer', 3, 'Specialist - Tax Accountant', '2023-11-26', 'Ahmedabad', 'On Notice', { lastWorkingDay: '2026-11-08' }),
  seed(5, 'Bhavin Trivedi', 3, 'Specialist - Accountant', '2026-07-30', 'Rajkot', 'Active'),
  seed(6, 'Charvi Nair', 3, 'Specialist - Tax Accountant', '2023-11-26', 'Ahmedabad', 'Active'),
  seed(7, 'Dev Malhotra', 4, 'Team Lead - Supervisor - Tax Reviewer', '2023-11-26', 'Ahmedabad', 'Active'),
  seed(8, 'Farhan Qureshi', 3, 'Specialist - Accountant', '2024-01-28', 'Ahmedabad', 'On Notice', { lastWorkingDay: '2026-11-20' }),
  seed(9, 'Gaurav Bansal', 5, 'Sr. Team Lead - Senior Roles', '2023-01-01', 'Ahmedabad', 'Active', { engagementType: 'Regular Staffing' }),
  seed(10, 'Heena Kulkarni', 3, 'Specialist - Tax Accountant', '2023-01-01', 'Ahmedabad', 'Active'),
  seed(11, 'Isha Menon', 3, 'Specialist - Tax Accountant', '2023-11-26', 'Gandhinagar', 'On Notice', { lastWorkingDay: '2026-12-05' }),
  seed(12, 'Kavya Reddy', 4, 'Team Lead - Supervisor - Tax Reviewer', '2022-07-11', 'Ahmedabad', 'Active', { engagementType: 'Regular Staffing', additionalAvailability: 10 }),
  seed(13, 'Manav Saxena', 4, 'Team Lead - Supervisor - Tax Reviewer', '2022-09-05', 'Vadodara', 'Active', { additionalAvailability: 8 }),
  seed(14, 'Mihir Chawla', 2, 'Associate - Tax Preparer', '2026-09-08', 'Ahmedabad', 'Active', { engagementType: 'Seasonal Staffing', committedHours: 30 }),
  seed(15, 'Nikhil Pandya', 2, 'Associate - Bookkeeper', '2026-08-03', 'Rajkot', 'Replacement In-Progress'),
  seed(16, 'Priti Bhatt', 3, 'Specialist - Accountant', '2023-06-12', 'Surat', 'Active', { additionalAvailability: 5 }),
  seed(17, 'Rohan Verma', 3, 'Specialist - Audit Associate', '2023-04-03', 'Ahmedabad', 'Active'),
  seed(18, 'Uday Sethi', 2, 'Associate - Accountant', '2024-10-07', 'Ahmedabad', 'Offboarding In-Progress', { lastWorkingDay: '2026-10-31' }),
  seed(19, 'Varun Gill', 3, 'Specialist - Tax Accountant', '2022-02-14', 'Ahmedabad', 'Inactive', { lastWorkingDay: '2025-12-31' }),
  seed(20, 'Zara Sheikh', 2, 'Associate - Bookkeeper', '2023-08-21', 'Gandhinagar', 'Inactive', { lastWorkingDay: '2026-03-15' }),
];

/** Staff cards shown before "Load more" */
export const MY_STAFF_PAGE_SIZE = 10;

/** Staff profile tabs (desktop staff details page, opened from the eye icon) */
export const STAFF_PROFILE_TABS = [
  'Personal Information',
  'Work Information',
  'Reporting To',
  'Attendance & Leave',
  'Skills & Qualification',
  'Employee Documents',
  'Terms of Employment',
  'Training & Development',
  'System & IT Details',
  'Assessments',
  'SOP',
] as const;

export type StaffProfileTab = (typeof STAFF_PROFILE_TABS)[number];

/** Unique sorted values of a field, for filter options */
export const staffOptions = (staff: ClientStaffMember[], pick: (s: ClientStaffMember) => string | null) =>
  Array.from(new Set(staff.map(pick).filter((v): v is string => Boolean(v)))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

/** "Mar 31, 2024" */
export const formatStaffDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
