export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

/**
 * Notice    = active, serving notice (awaiting / after approvals)
 * Withdrawn = pulled back by the staff member
 * Rejected  = declined by the reporting manager
 */
export type ResignationStatus = 'Notice' | 'Withdrawn' | 'Rejected';

export interface ResignationRecord {
  id: string;
  staffName: string;
  staffCode: string;
  designation: string;
  department: string;
  resignationDate: string; // YYYY-MM-DD
  lastWorkingDate: string; // YYYY-MM-DD
  reasons: string[];
  emailContent: string;
  attachments: string[];
  status: ResignationStatus;
  reportingManager: string;
  managerApproval: ApprovalStatus;
  managerComment?: string;
  managerReviewedAt?: string; // YYYY-MM-DD
  ctmApproval: ApprovalStatus;
  ctmComment?: string;
  withdrawReason?: string;
  withdrawnAt?: string; // YYYY-MM-DD
}

export type ReviewDecision = 'Approved' | 'Rejected';
