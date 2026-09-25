export type WFOStatus = 'Pending' | 'Approved' | 'Rejected';

export interface WFORecord {
  id: string;
  month: string; // e.g. "September"
  year: number; // e.g. 2026
  monthYear: string; // e.g. "September 2026"
  days: number; // e.g. 20
  status: WFOStatus;
  submittedAt?: string;
  notes?: string;
}
