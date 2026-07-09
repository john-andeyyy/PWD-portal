export const PERMISSION_CATALOG = [
  { key: "members.create", displayName: "Create members" },
  { key: "members.view", displayName: "View members" },
  { key: "members.update", displayName: "Update members" },
  { key: "members.delete", displayName: "Delete members" },
  { key: "accounts.manage", displayName: "Manage accounts and roles" },
] as const;

export type AppPermission = (typeof PERMISSION_CATALOG)[number]["key"];

const PERMISSION_KEYS = new Set<string>(
  PERMISSION_CATALOG.map((permission) => permission.key),
);

export const isAppPermission = (
  permission: string,
): permission is AppPermission => PERMISSION_KEYS.has(permission);

export const getPermissionCatalog = () =>
  PERMISSION_CATALOG.map((permission) => ({
    key: permission.key,
    displayName: permission.displayName,
  }));