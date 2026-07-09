import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";

type RequestUser = {
  userId: string;
  permissions?: string[];
  isSuperAdmin?: boolean;
};

const canManageAccounts = (user: RequestUser) =>
  user.isSuperAdmin === true ||
  (Array.isArray(user.permissions) &&
    user.permissions.includes("accounts.manage"));

type MemberListQuery = {
  search?: string;
  barangay?: string;
  disability?: string;
  isBedridden?: string;
  page?: string;
  limit?: string;
  sortBy?: "fname" | "lname" | "joinedAt";
  sortOrder?: "asc" | "desc";
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

  async create(presidentId: string, data: CreateMemberDto) {
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
        president: { connect: { id: presidentId as any } },
      },
    });
  }

  async findAll(user: RequestUser, query: MemberListQuery = {}) {
    const filters: Prisma.MemberWhereInput[] = [];

    if (!canManageAccounts(user)) {
      filters.push({ presidentId: user.userId as any });
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
      filters.push({
        barangay: { equals: query.barangay.trim(), mode: "insensitive" },
      });
    }

    if (query.disability?.trim()) {
      filters.push({
        disability: { equals: query.disability.trim(), mode: "insensitive" },
      });
    }

    const bedridden = parseBooleanQuery(query.isBedridden);
    if (bedridden !== undefined) {
      filters.push({ isBedridden: bedridden });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const sortBy = query.sortBy ?? "lname";
    const sortOrder: Prisma.SortOrder =
      query.sortOrder === "desc" ? "desc" : "asc";

    const where = filters.length > 0 ? { AND: filters } : undefined;
    const orderBy: Prisma.MemberOrderByWithRelationInput[] =
      sortBy === "fname"
        ? [{ fname: sortOrder }, { lname: sortOrder }]
        : sortBy === "joinedAt"
          ? [{ joinedAt: sortOrder }]
          : [{ lname: sortOrder }, { fname: sortOrder }];

    const [data, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.member.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getGlobalStats() {
    const [total, grouped] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.groupBy({
        by: ["disability"],
        _count: { _all: true },
        orderBy: { _count: { disability: "desc" } },
      }),
    ]);

    return {
      total,
      byDisability: grouped.map((item) => ({
        disability: item.disability,
        count: item._count._all,
      })),
    };
  }

  async findOne(user: RequestUser, id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: id as any },
    });
    if (
      !member ||
      (!canManageAccounts(user) && member.presidentId !== (user.userId as any))
    ) {
      throw new NotFoundException("Member not found");
    }
    return member;
  }

  async update(user: RequestUser, id: string, data: UpdateMemberDto) {
    await this.findOne(user, id);
    const payload: Record<string, unknown> = { ...data };

    if (data.bday) {
      payload.bday = new Date(data.bday);
    }

    if (data.dateIssued) {
      payload.dateIssued = new Date(data.dateIssued);
    }

    return this.prisma.member.update({
      where: { id: id as any },
      data: payload,
    });
  }

  async remove(user: RequestUser, id: string) {
    await this.findOne(user, id);
    return this.prisma.member.delete({ where: { id: id as any } });
  }
}
