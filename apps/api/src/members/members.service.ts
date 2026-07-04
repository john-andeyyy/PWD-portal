import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";

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

  async findAll(presidentId: number) {
    return this.prisma.member.findMany({ where: { presidentId } });
  }

  async findOne(presidentId: number, id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });
    if (!member || member.presidentId !== presidentId) {
      throw new NotFoundException("Member not found");
    }
    return member;
  }

  async update(presidentId: number, id: number, data: UpdateMemberDto) {
    await this.findOne(presidentId, id);
    const payload: Record<string, unknown> = { ...data };

    if (data.bday) {
      payload.bday = new Date(data.bday);
    }

    if (data.dateIssued) {
      payload.dateIssued = new Date(data.dateIssued);
    }

    return this.prisma.member.update({ where: { id }, data: payload });
  }

  async remove(presidentId: number, id: number) {
    await this.findOne(presidentId, id);
    return this.prisma.member.delete({ where: { id } });
  }
}
