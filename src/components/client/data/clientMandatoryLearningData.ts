/**
 * Learning & Development › Mandatory Learning (Client). Desktop: `controller/mandatorylearning.php` (`index`, `courses_list`,
 * `get_course_users`, `filter_data`, `filter_clear_data`) + `templates/mandatorylearning/index.tpl` + `model/dbmandatorylearning.php`.
 * Read-only report: the mandatory courses assigned to the client's current staff (Course Name, Hours, Total Assigned,
 * Total Completed) with a "Progress Details" panel per course (Staff, Assigned On, Completed On, Status).
 * B (MyCPE ONE) has nothing for this page. Dummy data only.
 */
import { CURRENT_STAFF_STATUSES, MY_STAFF_SEED } from './clientStaffData';

/** Desktop shows Completed (green), In-Progress (amber) and anything else as a grey badge */
export const ML_STATUSES = ['Completed', 'In-Progress', 'Not Started'] as const;
export type MlStatus = (typeof ML_STATUSES)[number];

export interface MlAssignment {
  /** `ClientStaffMember.id` */
  staffId: string;
  /** ISO date */
  assignedOn: string;
  /** ISO date; only set once Completed */
  completedOn: string | null;
  status: MlStatus;
}

export interface MandatoryCourse {
  id: string;
  name: string;
  /** Desktop `no_of_hrs` */
  hours: number;
  assignments: MlAssignment[];
}

export interface MlCounts {
  assigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  /** 0-100, whole percent */
  percent: number;
}

export const countsOf = (assignments: MlAssignment[]): MlCounts => {
  const completed = assignments.filter((a) => a.status === 'Completed').length;
  const inProgress = assignments.filter((a) => a.status === 'In-Progress').length;
  return {
    assigned: assignments.length,
    completed,
    inProgress,
    notStarted: assignments.length - completed - inProgress,
    percent: assignments.length ? Math.round((completed / assignments.length) * 100) : 0,
  };
};

export const formatMlDate = (iso: string | null) =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-';

/** Desktop `course_name LIKE %term%` */
export const matchesCourseName = (c: MandatoryCourse, term: string) => c.name.toLowerCase().includes(term.trim().toLowerCase());

/** Desktop `ORDER BY assigned_on DESC` */
export const newestAssignedFirst = (a: MlAssignment, b: MlAssignment) => b.assignedOn.localeCompare(a.assignedOn) || a.staffId.localeCompare(b.staffId, undefined, { numeric: true });

/* ---------- Dummy seed ---------- */

/** The seed's "today"; completion dates never go past it */
const TODAY = '2026-10-16';
const pad = (n: number) => String(n).padStart(2, '0');

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const earlier = (a: string, b: string) => (a < b ? a : b);
const later = (a: string, b: string) => (a > b ? a : b);

/** Desktop lists mandatory courses only for staff currently on the client's engagement (everyone except Inactive) */
const CURRENT_STAFF = MY_STAFF_SEED.filter((s) => CURRENT_STAFF_STATUSES.includes(s.status));
const joiningOf = (id: string) => MY_STAFF_SEED.find((s) => s.id === id)?.joiningDate ?? '2023-01-01';

interface CourseSpec {
  n: number;
  name: string;
  hours: number;
  /** First assignment date; later joiners get it a couple of days after they join */
  base: string;
  /** Staff numbers (`ms<n>`) per status */
  done: number[];
  progress: number[];
  todo: number[];
  /** Completion date overrides (staff number → ISO) */
  doneOn?: Record<number, string>;
}

const course = (c: CourseSpec): MandatoryCourse => {
  const assign = (num: number): Pick<MlAssignment, 'staffId' | 'assignedOn'> => {
    const staffId = `ms${num}`;
    // Desktop assigns a course to everyone on the same day; later joiners get it a couple of days after they join
    return { staffId, assignedOn: earlier(later(c.base, addDays(joiningOf(staffId), 2)), TODAY) };
  };
  const assignments: MlAssignment[] = [
    ...c.done.map((num): MlAssignment => {
      const a = assign(num);
      const completedOn = c.doneOn?.[num] ?? earlier(addDays(a.assignedOn, 2 + ((num * 3) % 9)), TODAY);
      return { ...a, completedOn, status: 'Completed' };
    }),
    ...c.progress.map((num): MlAssignment => ({ ...assign(num), completedOn: null, status: 'In-Progress' })),
    ...c.todo.map((num): MlAssignment => ({ ...assign(num), completedOn: null, status: 'Not Started' })),
  ];
  // Only staff who are still on the engagement
  return {
    id: `mc${c.n}`,
    name: c.name,
    hours: c.hours,
    assignments: assignments.filter((a) => CURRENT_STAFF.some((s) => s.id === a.staffId)),
  };
};

/**
 * Mirrors the desktop list: 2 courses, 6 staff each (Information Security Policy 1/6 completed, POSH Training 0/6).
 * Staff ids match `MY_STAFF_SEED`. Charvi Nair (ms6) is the one who completed Information Security Policy (see the "Learning" notification).
 */
export const MANDATORY_COURSES_SEED: MandatoryCourse[] = [
  course({ n: 1, name: 'Information Security Policy', hours: 1, base: '2026-10-10', done: [6], progress: [], todo: [1, 3, 7, 9, 12], doneOn: { 6: '2026-10-13' } }),
  course({ n: 2, name: 'POSH (Prevention of Sexual Harassment) Training', hours: 3, base: '2026-10-10', done: [], progress: [], todo: [1, 3, 6, 7, 9, 12] }),
];
