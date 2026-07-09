import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";

type RequestUser = {
  userId: number;
  permissions?: string[];
};

const canManageAccounts = (user: RequestUser) =>
  Array.isArray(user.permissions) &&
  user.permissions.includes("accounts.manage");

type MemberListQuery = {
  search?: string;
  barangay?: string;
  disability?: string;
  isBedridden?: string;
};

const parseBooleanQuery = (value?: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  return undefined;
};

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(presidentId: number, data: CreateMemberDto) {
    const { dateIssued, ...rest } = data;
    const payload = dateIssued
      ? {
          ...rest,
          bday: new Date(data.bday),
          dateIssued: new Date(dateIssued),
        }
      : {
          ...rest,
          bday: new Date(data.bday),
        };

    return this.prisma.member.create({
      data: {
        ...payload,
        president: { connect: { id: presidentId } },
      },
    });
  }

  async findAll(user: RequestUser, query: MemberListQuery = {}) {
    const filters: Prisma.MemberWhereInput[] = [];

    if (!canManageAccounts(user)) {
      filters.push({ presidentId: user.userId });
    }

    const search = query.search?.trim();
    if (search) {
      filters.push({
        OR: [
          { fname: { contains: search, mode: "insensitive" } },
          { lname: { contains: search, mode: "insensitive" } },
          { mname: { contains: search, mode: "insensitive" } },
          { pwdId: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (query.barangay?.trim()) {
      filters.push({ barangay: { equals: query.barangay.trim(), mode: "insensitive" } });
    }

    if (query.disability?.trim()) {
      filters.push({ disability: { equals: query.disability.trim(), mode: "insensitive" } });
    }

    const bedridden = parseBooleanQuery(query.isBedridden);
    if (bedridden !== undefined) {
      filters.push({ isBedridden: bedridden });
    }

    return this.prisma.member.findMany({
      where: filters.length > 0 ? { AND: filters } : undefined,
      orderBy: { joinedAt: "desc" },
    });
  }

  async findOne(user: RequestUser, id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });
    if (
      !member ||
      (!canManageAccounts(user) && member.presidentId !== user.userId)
    ) {
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
