import { CLIENT_MENU_GROUPS } from '../home/clientMenu';

/**
 * Desktop Client Contact Roles (`clientcontactroles`): per-menu flags stored as JSON in
 * `tblclient_contact_menu_permissions` (fallback `tblcp_menu_permissions` by `client_hub_role`).
 * No `is_list` → menu hidden + "no access" (desktop redirects to Dashboard).
 */
export type ClientPermissionFlag = 'list' | 'view' | 'add' | 'edit' | 'delete' | 'download';
export type ClientModulePermission = Record<ClientPermissionFlag, boolean>;

export interface ClientContactRole {
  id: string;
  name: string;
  description: string;
  /** module id → granted flags (missing module = no access) */
  permissions: Record<string, ClientPermissionFlag[]>;
}

const FULL: ClientPermissionFlag[] = ['list', 'view', 'add', 'edit', 'delete', 'download'];
const READ: ClientPermissionFlag[] = ['list', 'view'];
const READ_DOWNLOAD: ClientPermissionFlag[] = ['list', 'view', 'download'];

export const NO_PERMISSION: ClientModulePermission = { list: false, view: false, add: false, edit: false, delete: false, download: false };
export const FULL_PERMISSION: ClientModulePermission = { list: true, view: true, add: true, edit: true, delete: true, download: true };

/** Global shell items every contact has on desktop (dashboard, sidebar cards, profile menu) */
export const ALWAYS_ALLOWED_MODULES = ['dashboard', 'account-manager', 'other-modules', 'news-insights', 'user-profile'];

const ALL_MODULE_IDS = CLIENT_MENU_GROUPS.flatMap((g) => g.modules.map((m) => m.id));
const grantAll = (flags: ClientPermissionFlag[]) => Object.fromEntries(ALL_MODULE_IDS.map((id) => [id, flags]));

/** Mock roles for the prototype role switch (drawer footer). Real roles come from the firm's Contact Roles */
export const CLIENT_CONTACT_ROLES: ClientContactRole[] = [
  {
    id: 'admin',
    name: 'Client Admin',
    description: 'Primary contact. Full access to every module.',
    permissions: grantAll(FULL),
  },
  {
    id: 'hr',
    name: 'HR Manager',
    description: 'Manages staff, attendance and surveys. No finance.',
    permissions: {
      'my-staff': ['list', 'view', 'add', 'edit', 'download'],
      attendance: ['list', 'view', 'edit'],
      leaves: READ,
      holidays: READ,
      'staff-documents': READ_DOWNLOAD,
      'work-flexibility': ['list', 'view', 'edit'],
      'feedback-evaluation': ['list', 'view', 'edit', 'download'],
      performance: FULL,
      pip: FULL,
      learnings: FULL,
      'training-need': FULL,
      'mandatory-learning': READ,
      'staff-hub': ['list', 'view', 'add', 'download'],
      requirements: ['list', 'view', 'add', 'edit'],
      interviews: ['list', 'view', 'add', 'edit'],
      'company-profile': READ,
      directories: READ,
      timesheets: READ,
      inclusions: READ,
    },
  },
  {
    id: 'finance',
    name: 'Finance & Billing',
    description: 'Invoices, payroll and fees. Staff list read-only.',
    permissions: {
      'my-staff': READ,
      'mgmt-fee': READ,
      invoices: READ_DOWNLOAD,
      'billing-details': ['list', 'view', 'add', 'edit', 'delete'],
      inclusions: READ,
      timesheets: READ_DOWNLOAD,
      'payroll-ledger': READ_DOWNLOAD,
      compensation: READ_DOWNLOAD,
      'hiring-pricing': READ,
      utilization: READ_DOWNLOAD,
      'company-profile': READ_DOWNLOAD,
      directories: READ,
    },
  },
  {
    id: 'viewer',
    name: 'View Only',
    description: 'Can open modules but not change or download anything.',
    permissions: grantAll(READ),
  },
];

export const permissionFor = (role: ClientContactRole, moduleId: string): ClientModulePermission => {
  if (ALWAYS_ALLOWED_MODULES.includes(moduleId)) return FULL_PERMISSION;
  const flags = role.permissions[moduleId];
  if (!flags?.includes('list')) return NO_PERMISSION;
  return Object.fromEntries((Object.keys(NO_PERMISSION) as ClientPermissionFlag[]).map((f) => [f, flags.includes(f)])) as ClientModulePermission;
};
