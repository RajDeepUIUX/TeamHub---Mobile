import type { ThreadComment } from './comments';

export type FlexType = 'Work From Home' | 'Work From Office' | 'Hybrid' | 'Early Shift' | 'Early Friday';

export type FlexDuration = 'Permanent' | 'Temporary';

/** Pending → Approved / Rejected (manager) → IT Review Done (IT, only after approval) */
export type FlexStatus = 'Pending' | 'Approved' | 'Rejected' | 'IT Review Done';

export type AddressType = 'Current' | 'Permanent';

export interface DeliveryAddress {
  type: AddressType;
  address: string;
  landmark: string;
  country: string;
  state: string;
  city: string;
  zip: string;
}

/** Permanent Hybrid: which days follow the split, and the office / home time windows (HH:mm) */
export interface HybridSchedule {
  mode: 'Days' | 'Daily';
  /** Weekdays that follow the split (mode = 'Days') */
  days?: string[];
  wfoFrom: string;
  wfoTo: string;
  wfhFrom: string;
  wfhTo: string;
}

/** Request details shared by Work From Home, Hybrid and Early Shift requests */
export interface WfhDetails {
  reason: string;
  attachments: string[];
  /** Asset name → quantity (only assets with quantity > 0) */
  assets: Record<string, number>;
  /** Present when at least one asset is requested */
  deliveryAddress?: DeliveryAddress;
  /** Present for requests that include the acknowledgement section (WFH / Hybrid) */
  acknowledgedBy?: string;
  acknowledgedOn?: string; // YYYY-MM-DD
}

export interface FlexRequest {
  id: string;
  /** Who raised it (shown in the manager's team view) */
  staffName: string;
  staffCode: string;
  type: FlexType;
  /** Permanent / Temporary — not asked for Work From Office */
  duration?: FlexDuration;
  /** Effective date (permanent) or period start (temporary), YYYY-MM-DD. Not used for Work From Office. */
  startDate?: string;
  /** Period end for temporary requests, YYYY-MM-DD */
  endDate?: string;
  /** Permanent Hybrid: day selection and WFO / WFH time windows */
  hybrid?: HybridSchedule;
  /** Early Shift: requested shift window */
  shift?: string;
  /** Early Friday: requested Friday logout time */
  fridayLogout?: string;
  /** Work From Office: requested office hours (HH:mm, 24h) */
  startTime?: string;
  endTime?: string;
  /** Work From Home & Hybrid: reason, assets, delivery address and acknowledgement */
  wfh?: WfhDetails;
  /** Reason (required), or optional notes for Work From Office / Work From Home */
  reason: string;
  status: FlexStatus;
  submittedAt: string; // ISO timestamp
  /** Set when the staff member edits a pending request */
  updatedAt?: string; // ISO timestamp
  /** Reporting manager's note (approval) or reason (rejection) */
  managerComment?: string;
  reviewedBy?: string;
  reviewedAt?: string; // e.g. "Sep 29, 2026"
  /** Set when IT completes its review of an approved request */
  itReviewedBy?: string;
  itReviewedAt?: string; // e.g. "Sep 30, 2026"
  /** Staff ↔ manager conversation on this request */
  comments?: ThreadComment[];
}
