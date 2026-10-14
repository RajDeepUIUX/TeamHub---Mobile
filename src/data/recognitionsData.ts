import { TEAM_REPORTING_MANAGERS } from './teamAttendanceData';

/** L&D › Recognitions: tags the L&D team awards staff for their contributions (view-only) */

export const RECOGNITION_TAGS = ['Content Developers', 'Feedback Provider', 'Trainer', 'Mentor', 'Quiz Master', 'Knowledge Sharer'] as const;
export type RecognitionTag = (typeof RECOGNITION_TAGS)[number];

export interface Recognition {
  id: string;
  staffName: string;
  staffCode: string;
  reportingManager: string;
  reportingManagerCode: string;
  /** Client Team Manager */
  ctm: string;
  ctmCode: string;
  tag: RecognitionTag;
  /** Hours credited for the contribution; null when not tracked */
  hours: number | null;
  branch: string;
  recognizedOn: string; // ISO
}

const MANAGER_CODES: Record<string, string> = {
  'Naveen Das': 'A01120',
  'Aryan Sharma': 'A01980',
  'Meera Iyer': 'A02104',
  'Harsh Trivedi': 'A01875',
  'Priya Nair': 'A00842',
};

const CTMS: Record<string, string> = {
  'Ritika Menon': 'A01342',
  'Harsh Trivedi': 'A01875',
};

const memberOf = (name: string) => {
  for (const m of TEAM_REPORTING_MANAGERS) {
    const x = m.members.find((s) => s.staffName === name);
    if (x) return { staffName: x.staffName, staffCode: x.staffCode, branch: x.branch, reportingManager: m.name };
  }
  return null;
};

// People outside the reporting hierarchy above (other teams, and the manager login themselves)
const OUTSIDE_HIERARCHY: Record<string, { staffCode: string; reportingManager: string }> = {
  'Naveen Das': { staffCode: 'A01120', reportingManager: 'Priya Nair' },
  'Siddharth Nair': { staffCode: 'A03128', reportingManager: 'Harsh Trivedi' },
  'Komal Parmar': { staffCode: 'A03366', reportingManager: 'Harsh Trivedi' },
  'Devansh Patel': { staffCode: 'A03721', reportingManager: 'Harsh Trivedi' },
};

const rec = (
  id: string,
  staffName: string,
  tag: RecognitionTag,
  hours: number | null,
  recognizedOn: string,
  ctm: keyof typeof CTMS = 'Ritika Menon'
): Recognition => {
  const member = memberOf(staffName);
  const other = OUTSIDE_HIERARCHY[staffName];
  const reportingManager = member?.reportingManager ?? other.reportingManager;
  return {
    id,
    staffName,
    staffCode: member?.staffCode ?? other.staffCode,
    reportingManager,
    reportingManagerCode: MANAGER_CODES[reportingManager],
    ctm,
    ctmCode: CTMS[ctm],
    tag,
    hours,
    branch: member?.branch ?? 'Gota - Ahmedabad',
    recognizedOn,
  };
};

export const RECOGNITIONS_SEED: Recognition[] = [
  rec('rc-1', 'John Smith', 'Content Developers', 1, '2026-09-22'),
  rec('rc-2', 'John Smith', 'Feedback Provider', 12, '2026-08-30'),
  rec('rc-3', 'John Smith', 'Feedback Provider', 60, '2026-07-14'),
  rec('rc-4', 'John Smith', 'Content Developers', null, '2026-05-09'),
  rec('rc-5', 'Ananya Kulkarni', 'Trainer', 8, '2026-09-18'),
  rec('rc-6', 'Ananya Kulkarni', 'Mentor', 16, '2026-06-27'),
  rec('rc-7', 'Vikram Rao', 'Quiz Master', 3, '2026-09-05'),
  rec('rc-8', 'Kunal Desai', 'Knowledge Sharer', 6, '2026-08-12', 'Harsh Trivedi'),
  rec('rc-9', 'Pooja Bhatt', 'Content Developers', 4, '2026-09-26', 'Harsh Trivedi'),
  rec('rc-10', 'Rohan Mehta', 'Trainer', 20, '2026-07-30', 'Harsh Trivedi'),
  rec('rc-11', 'Farhan Shaikh', 'Feedback Provider', 2, '2026-09-29'),
  rec('rc-12', 'Siddharth Nair', 'Mentor', 24, '2026-09-10'),
  rec('rc-13', 'Komal Parmar', 'Content Developers', 10, '2026-08-21'),
  rec('rc-14', 'Devansh Patel', 'Quiz Master', null, '2026-06-03'),
  rec('rc-15', 'Naveen Das', 'Trainer', 14, '2026-09-08', 'Harsh Trivedi'),
  rec('rc-16', 'Naveen Das', 'Mentor', 30, '2026-07-02', 'Harsh Trivedi'),
].sort((a, b) => b.recognizedOn.localeCompare(a.recognizedOn));
