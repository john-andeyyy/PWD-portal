import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { isAppPermission } from "../auth/permissions.catalog";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  private assertPermissionsAreValid(permissions?: string[]) {
    if (!permissions || permissions.length === 0) {
      return [];
    }

    const invalidPermissions = permissions.filter(
      (permission) => !isAppPermission(permission),
    );

    if (invalidPermissions.length > 0) {
      throw new BadRequestException(
        `Invalid permissions: ${invalidPermissions.join(", ")}`,
      );
    }

    return permissions;
  }

  async findAll(page: number, limit: number) {
    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.role.count(),
    ]);

    return { data, total, page, limit };
  }

  async create(data: CreateRoleDto) {
    const permissions = this.assertPermissionsAreValid(data.permissions);

    return this.prisma.role.create({
      data: {
        name: data.name,
        permissions,
      },
    });
  }

  async update(id: string, data: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id: id as any },
    });
    if (!role) {
      throw new NotFoundException("Role not found");
    }

    const permissions = data.permissions
      ? this.assertPermissionsAreValid(data.permissions)
      : undefined;

    return this.prisma.role.update({
      where: { id: id as any },
      data: {
        name: data.name,
        permissions,
      },
    });
  }
}
