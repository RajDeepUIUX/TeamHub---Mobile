export type WFOStatus = 'Pending' | 'Approved' | 'Rejected';

/** The reporting manager's decision on a WFO request */
export interface WFOReview {
  by: string;
  comment: string;
  on: string; // ISO date
}

export interface WFORecord {
  id: string;
  /** Who submitted it (staff and manager views read one shared list) */
  staffName: string;
  staffCode: string;
  month: string; // e.g. "September"
  year: number; // e.g. 2026
  monthYear: string; // e.g. "September 2026"
  days: number; // e.g. 20
  status: WFOStatus;
  submittedAt?: string;
  notes?: string;
  review?: WFOReview;
}
