export type AssetStatus = 'Assigned' | 'Return Requested' | 'Returned';

export interface AssetRecord {
  id: string;
  /** e.g. "ENT--Laptop-014780" */
  code: string;
  /** Asset group, e.g. "Laptop", "Monitor" */
  group: string;
  brand?: string;
  deskNo: string;
  staffName: string;
  staffCode: string;
  department: string;
  assignedOn: string; // ISO date
  returnRequestedOn?: string; // ISO date
  returnedOn?: string; // ISO date
  status: AssetStatus;
}
