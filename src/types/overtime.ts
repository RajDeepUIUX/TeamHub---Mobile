/** OT requests have no manager approval step: they're approved as soon as they're submitted */
export type OTStatus = 'Approved';

export type OTClientType = 'Existing' | 'New';

export interface OTRequest {
  id: string;
  staffName: string;
  staffCode: string;
  country: string;
  domain: string;
  clientType: OTClientType;
  /** Extra hours offered per day */
  extraHours: number | null;
  availability: string;
  remarks: string;
  /** Hours already assigned against this availability (set by the business) */
  assignedHours: number;
  status: OTStatus;
  submittedAt: string; // ISO timestamp
}
