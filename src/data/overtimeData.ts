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
