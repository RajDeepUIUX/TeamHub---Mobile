export type OTStatus = 'Pending' | 'Approved' | 'Rejected';

export type OTClientType = 'Existing' | 'New';

export interface OTRequest {
  id: string;
  staffName: string;
  staffCode: string;
  country: string;
  domain: string;
  clientType: OTClientType;
  /** Extra hours offered per day (optional on the form) */
  extraHours: number | null;
  availability: string;
  remarks: string;
  /** Hours already assigned against this availability (set by the business) */
  assignedHours: number;
  status: OTStatus;
  submittedAt: string; // ISO timestamp
}
