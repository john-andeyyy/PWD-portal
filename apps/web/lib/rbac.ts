export const APP_PERMISSIONS = [
  "members.create",
  "members.view",
  "members.update",
  "members.delete",
  "accounts.manage",
] as const;

export type AppPermission = (typeof APP_PERMISSIONS)[number];

export const hasPermission = (
  permissions: string[] | undefined,
  permission: AppPermission,
): boolean => {
  return Array.isArray(permissions) && permissions.includes(permission);
};
