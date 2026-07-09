import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";

type RequestUser = {
  userId: number;
  permissions?: string[];
};

const canManageAccounts = (user: RequestUser) =>
  Array.isArray(user.permissions) && user.permissions.includes("accounts.manage");

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(presidentId: number, data: CreateMemberDto) {
    const payload = {
      ...data,
      bday: new Date(data.bday),
      dateIssued: new Date(data.dateIssued),
    };

    return this.prisma.member.create({
      data: {
        ...payload,
        president: { connect: { id: presidentId } },
      },
    });
  }

  async findAll(user: RequestUser) {
    if (canManageAccounts(user)) {
      return this.prisma.member.findMany({
        orderBy: { joinedAt: "desc" },
      });
    }

    return this.prisma.member.findMany({ where: { presidentId: user.userId } });
  }

  async findOne(user: RequestUser, id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });
    if (!member || (!canManageAccounts(user) && member.presidentId !== user.userId)) {
      throw new NotFoundException("Member not found");
    }
    return member;
  }

  async update(user: RequestUser, id: number, data: UpdateMemberDto) {
    await this.findOne(user, id);
    const payload: Record<string, unknown> = { ...data };

    if (data.bday) {
      payload.bday = new Date(data.bday);
    }

    if (data.dateIssued) {
      payload.dateIssued = new Date(data.dateIssued);
    }

    return this.prisma.member.update({ where: { id }, data: payload });
  }

  async remove(user: RequestUser, id: number) {
    await this.findOne(user, id);
    return this.prisma.member.delete({ where: { id } });
  }
}
