import type { AssetRecord } from '../types/assets';

export const ASSET_GROUPS = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headphones', 'Webcams', 'Mobile Phones', 'CPU'];

/** "2024-12-03" -> "Dec 03, 2024" (matches the web portal) */
export const formatAssetDate = (iso?: string) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : '—';

type Owner = Pick<AssetRecord, 'staffName' | 'staffCode' | 'department' | 'deskNo'>;

const JOHN: Owner = { staffName: 'John Smith', staffCode: 'A03780', department: 'Product Development Team', deskNo: 'VRT-319' };
const NAVEEN: Owner = { staffName: 'Naveen Das', staffCode: 'A01120', department: 'Product Development Team', deskNo: 'GT-011' };
const ANANYA: Owner = { staffName: 'Ananya Kulkarni', staffCode: 'A03515', department: 'Product Development Team', deskNo: 'MR-F07-029' };
const KUNAL: Owner = { staffName: 'Kunal Desai', staffCode: 'A02988', department: 'Product Development Team', deskNo: 'MR-F07-031' };
const NIDHI: Owner = { staffName: 'Nidhi Purohit', staffCode: 'A03211', department: 'Product Development Team', deskNo: 'VRT-322' };

const asset = (
  id: string,
  owner: Owner,
  group: string,
  serial: string,
  brand: string | undefined,
  assignedOn: string,
  extra: Partial<AssetRecord> = {}
): AssetRecord => ({
  id,
  code: `ENT--${group.replace(/\s+/g, '-')}-${serial}`,
  group,
  brand,
  assignedOn,
  status: 'Assigned',
  ...owner,
  ...extra,
});

/** Everyone's assets (staff and manager views both read from this list, so return requests stay in sync) */
export const ASSETS_SEED: AssetRecord[] = [
  // John Smith (signed-in staff)
  asset('as-1', JOHN, 'Keyboard', '011074', 'TVS', '2024-12-03', { status: 'Return Requested', returnRequestedOn: '2026-09-22' }),
  asset('as-2', JOHN, 'Mouse', '011995', 'Logitech', '2024-12-03'),
  asset('as-3', JOHN, 'Monitor', '015322', 'LG', '2024-12-03'),
  asset('as-4', JOHN, 'Headphones', '013059', 'Jabra', '2024-12-03', { status: 'Return Requested', returnRequestedOn: '2026-09-22' }),
  asset('as-5', JOHN, 'Laptop', '014780', 'Lenovo', '2024-12-03'),
  asset('as-6', { ...JOHN, deskNo: '3486' }, 'Mobile Phones', '014413', 'Samsung', '2024-09-30'),
  asset('as-7', { ...JOHN, deskNo: 'MR-F07-018' }, 'Monitor', '009871', 'Dell', '2023-06-12', { status: 'Returned', returnedOn: '2024-12-02' }),

  // Naveen Das (reporting manager)
  asset('as-20', NAVEEN, 'Laptop', '012210', 'Lenovo', '2026-04-09'),
  asset('as-21', NAVEEN, 'Headphones', '012161', undefined, '2024-04-18', { status: 'Return Requested', returnRequestedOn: '2026-09-18' }),
  asset('as-22', { ...NAVEEN, deskNo: 'MR-F07-029' }, 'Webcams', '012350', undefined, '2023-10-06'),
  asset('as-23', { ...NAVEEN, deskNo: 'MR-F07-029' }, 'Mouse', '011283', 'Logitech', '2023-10-06'),
  asset('as-24', { ...NAVEEN, deskNo: 'MR-F07-029' }, 'Monitor', '014058', 'LG', '2023-10-06'),
  asset('as-25', { ...NAVEEN, deskNo: 'MR-F07-029' }, 'Monitor', '014059', 'LG', '2023-10-06'),
  asset('as-26', { ...NAVEEN, deskNo: 'MR-F07-029' }, 'CPU', '013148', undefined, '2023-10-06'),

  // Rest of Naveen's team
  asset('as-40', ANANYA, 'Laptop', '015101', 'Dell', '2025-02-17'),
  asset('as-41', ANANYA, 'Monitor', '015102', 'Samsung', '2025-02-17'),
  asset('as-42', ANANYA, 'Headphones', '013377', 'Jabra', '2025-02-17', { status: 'Return Requested', returnRequestedOn: '2026-09-25' }),
  asset('as-43', KUNAL, 'Laptop', '013890', 'HP', '2024-07-08'),
  asset('as-44', KUNAL, 'Keyboard', '011512', 'Logitech', '2024-07-08'),
  asset('as-45', KUNAL, 'Mouse', '011513', 'Logitech', '2024-07-08'),
  asset('as-46', KUNAL, 'Webcams', '012402', 'Logitech', '2023-11-20', { status: 'Returned', returnedOn: '2025-08-14' }),
  asset('as-47', NIDHI, 'Laptop', '014990', 'Apple', '2025-06-02'),
  asset('as-48', NIDHI, 'Mobile Phones', '014501', 'Samsung', '2025-06-02'),
  asset('as-49', NIDHI, 'Monitor', '010664', 'LG', '2022-09-14', { status: 'Returned', returnedOn: '2025-06-01' }),
];

/** Team members whose assets the manager (Naveen Das) can see */
export const TEAM_ASSET_MEMBERS = [JOHN, ANANYA, KUNAL, NIDHI].map((o) => o.staffName);
