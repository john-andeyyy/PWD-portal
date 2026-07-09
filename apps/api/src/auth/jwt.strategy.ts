import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "temporary-secret",
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const president = (await this.prisma.president.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    })) as any;

    if (!president || !president.isEnabled) {
      throw new UnauthorizedException("Account disabled or not found");
    }

    const permissions = Array.isArray(president.role?.permissions)
      ? president.role.permissions
      : [];

    return {
      userId: payload.sub,
      email: payload.email,
      roleId: president.roleId,
      roleName: president.role?.name ?? null,
      isEnabled: president.isEnabled,
      permissions,
    };
  }
}
