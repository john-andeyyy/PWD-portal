import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";
import { PERMISSION_CATALOG } from "./permissions.catalog";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "temporary-secret",
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const president = (await this.prisma.president.findUnique({
      where: { id: payload.sub as any },
      include: { role: true, member: true },
    })) as any;

    if (!president || !president.isEnabled) {
      throw new UnauthorizedException("Account disabled or not found");
    }

    const permissions = Array.isArray(president.role?.permissions)
      ? president.role.permissions
      : [];

    const resolvedPermissions = president.isSuperAdmin
      ? PERMISSION_CATALOG.map((permission) => permission.key)
      : permissions;

    return {
      userId: payload.sub,
      email: president.email,
      name: president.name,
      roleId: president.roleId,
      roleName: president.role?.name ?? null,
      isEnabled: president.isEnabled,
      isSuperAdmin: president.isSuperAdmin,
      permissions: resolvedPermissions,
      member: president.member ?? null,
    };
  }
}
