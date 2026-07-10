export interface PermissionCatalogItem {
  key: string;
  displayName: string;
  description: string;
}

export const hasPermission = (
  permissions: string[] | undefined,
  permission: string,
): boolean => {
  return Array.isArray(permissions) && permissions.includes(permission);
};

export const fetchPermissionCatalog = async (
  apiBaseUrl: string,
): Promise<PermissionCatalogItem[]> => {
  const response = await fetch(`${apiBaseUrl}/auth/permissions`);

  if (!response.ok) {
    throw new Error("Unable to load permission catalog");
  }

  return response.json();
};
