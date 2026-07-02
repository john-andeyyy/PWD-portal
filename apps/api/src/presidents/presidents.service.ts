import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { CreatePresidentDto } from "./dto/create-president.dto";
import { UpdatePresidentDto } from "./dto/update-president.dto";

@Injectable()
export class PresidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number) {
    const [data, total] = await Promise.all([
      this.prisma.president.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: { role: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.president.count(),
    ]);

    return { data, total, page, limit };
  }

  async create(data: CreatePresidentDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.president.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        isEnabled: data.isEnabled ?? true,
        role: data.roleId ? { connect: { id: data.roleId } } : undefined,
      },
      include: { role: true },
    });
  }

  async update(id: number, data: UpdatePresidentDto) {
    const president = await this.prisma.president.findUnique({ where: { id } });
    if (!president) {
      throw new NotFoundException("President not found");
    }

    return this.prisma.president.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        isEnabled: data.isEnabled,
        role: data.roleId
          ? { connect: { id: data.roleId } }
          : data.roleId === null
            ? { disconnect: true }
            : undefined,
      },
      include: { role: true },
    });
  }
}
