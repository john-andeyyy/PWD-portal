import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";
export const Permissions = (...permissions: Array<string | string[]>) => {
  const normalized = permissions.flatMap((permission) =>
    Array.isArray(permission) ? permission : [permission],
  );
  return SetMetadata(PERMISSIONS_KEY, normalized);
};
