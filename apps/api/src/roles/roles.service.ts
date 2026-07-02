import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.role.create({
      data: {
        name: data.name,
        canCreateMembers: data.canCreateMembers ?? false,
        canViewMembers: data.canViewMembers ?? true,
        canUpdateMembers: data.canUpdateMembers ?? false,
        canDeleteMembers: data.canDeleteMembers ?? false,
        canManageRoles: data.canManageRoles ?? false,
      },
    });
  }

  async update(id: number, data: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException("Role not found");
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        canCreateMembers: data.canCreateMembers,
        canViewMembers: data.canViewMembers,
        canUpdateMembers: data.canUpdateMembers,
        canDeleteMembers: data.canDeleteMembers,
        canManageRoles: data.canManageRoles,
      },
    });
  }
}
