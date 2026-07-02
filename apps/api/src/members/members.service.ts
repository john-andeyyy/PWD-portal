import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(presidentId: number, data: CreateMemberDto) {
    return this.prisma.member.create({
      data: {
        ...data,
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
    return this.prisma.member.update({ where: { id }, data });
  }

  async remove(presidentId: number, id: number) {
    await this.findOne(presidentId, id);
    return this.prisma.member.delete({ where: { id } });
  }
}
