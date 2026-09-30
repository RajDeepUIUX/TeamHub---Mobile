import { OTRequest } from '../types/overtime';

export const OT_COUNTRIES = ['Canada', 'United States', 'United Kingdom', 'Israel'];

export const OT_DOMAINS = ['Accounting & Advisory', 'Tax', 'Audit', 'Non Technical', 'Specialized'];

export const OT_EXTRA_HOURS = [2, 4, 6, 8];

export const OT_AVAILABILITY_TYPES = [
  'Regular (Round the year)',
  'Temporary (15th Jan–15th Apr)',
  'Temporary Extended (15 Jan–15 Apr + 15th Aug–15th Oct)',
];

/** Standard working day used to convert extra hours to FTE (e.g. 2h → 0.25) */
export const OT_HOURS_PER_FTE = 8;

export const otFte = (hours: number | null) => (hours ? +(hours / OT_HOURS_PER_FTE).toFixed(2) : 0);

export const otPendingHours = (r: Pick<OTRequest, 'extraHours' | 'assignedHours'>) =>
  Math.max(0, (r.extraHours ?? 0) - r.assignedHours);

/** Short label for an availability option, e.g. "Regular" or "Temporary Extended" */
export const otAvailabilityShort = (a: string) => a.split(' (')[0];

/** The period part of an availability option, e.g. "Round the year" */
export const otAvailabilityPeriod = (a: string) => {
  const m = a.match(/\((.*)\)/);
  return m ? m[1] : '';
};

/** Other team members' OT requests, as seen by their reporting manager */
export const TEAM_OT_REQUESTS_SEED: OTRequest[] = [
  {
    id: 'ot-team-1',
    staffName: 'Ananya Kulkarni',
    staffCode: 'A03515',
    country: 'United States',
    domain: 'Tax',
    clientType: 'Existing',
    extraHours: 4,
    availability: OT_AVAILABILITY_TYPES[1],
    remarks: 'Happy to cover the filing-season peak for the Hudson & Co. engagement.',
    assignedHours: 0,
    status: 'Pending',
    submittedAt: '2026-09-28T10:15:00.000Z',
  },
  {
    id: 'ot-team-2',
    staffName: 'Kunal Desai',
    staffCode: 'A02988',
    country: 'Canada',
    domain: 'Audit',
    clientType: 'New',
    extraHours: 2,
    availability: OT_AVAILABILITY_TYPES[0],
    remarks: '',
    assignedHours: 0,
    status: 'Pending',
    submittedAt: '2026-09-26T07:40:00.000Z',
  },
  {
    id: 'ot-team-3',
    staffName: 'Nidhi Purohit',
    staffCode: 'A03211',
    country: 'United Kingdom',
    domain: 'Accounting & Advisory',
    clientType: 'Existing',
    extraHours: 6,
    availability: OT_AVAILABILITY_TYPES[2],
    remarks: 'Available on weekday evenings during both busy seasons.',
    assignedHours: 4,
    status: 'Approved',
    submittedAt: '2026-09-12T09:05:00.000Z',
    reviewedBy: 'Naveen Das',
    reviewedAt: 'Sep 14, 2026',
  },
  {
    id: 'ot-team-4',
    staffName: 'Kunal Desai',
    staffCode: 'A02988',
    country: 'Israel',
    domain: 'Specialized',
    clientType: 'New',
    extraHours: 8,
    availability: OT_AVAILABILITY_TYPES[1],
    remarks: '',
    assignedHours: 0,
    status: 'Rejected',
    submittedAt: '2026-09-02T11:30:00.000Z',
    reviewedBy: 'Naveen Das',
    reviewedAt: 'Sep 04, 2026',
    managerComment: 'Full-day OT on top of your current load is too much — let’s revisit with 2–4 hrs.',
  },
];
