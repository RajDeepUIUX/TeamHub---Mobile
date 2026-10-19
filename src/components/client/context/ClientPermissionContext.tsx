import React, { createContext, useContext } from 'react';
import {
  CLIENT_CONTACT_ROLES,
  ClientContactRole,
  ClientModulePermission,
  permissionFor,
} from '../data/clientPermissionsData';

const ClientPermissionContext = createContext<ClientContactRole>(CLIENT_CONTACT_ROLES[0]);

/** Signed-in contact's role (Client Contact Roles); defaults to Client Admin */
export const ClientPermissionProvider: React.FC<{ role: ClientContactRole; children: React.ReactNode }> = ({ role, children }) => (
  <ClientPermissionContext.Provider value={role}>{children}</ClientPermissionContext.Provider>
);

export const useClientRole = () => useContext(ClientPermissionContext);

/** Flags for one menu module: `list` = can open, then view / add / edit / delete / download */
export const useClientPermission = (moduleId: string): ClientModulePermission => permissionFor(useClientRole(), moduleId);
