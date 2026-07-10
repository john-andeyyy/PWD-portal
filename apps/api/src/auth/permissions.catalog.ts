export const PERMISSION_CATALOG = [
  {
    key: "members.create",
    displayName: "Create members",
    description: "Add new PWD member records.",
  },
  {
    key: "members.view",
    displayName: "View members",
    description: "Open and review PWD member records.",
  },
  {
    key: "members.update",
    displayName: "Update members",
    description: "Edit existing PWD member details.",
  },
  {
    key: "members.delete",
    displayName: "Delete members",
    description: "Remove PWD member records.",
  },
  {
    key: "accounts.manage",
    displayName: "Manage accounts and roles",
    description: "Create accounts and change role permissions.",
  },
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
    description: permission.description,
  }));
