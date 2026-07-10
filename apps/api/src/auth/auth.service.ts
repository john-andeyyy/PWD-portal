import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { UpdateProfileDto } from "./dto/update-profile.dto";

type PresidentWithRelations = Prisma.PresidentGetPayload<{
  include: { role: true; member: true };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validatePresident(email: string, password: string) {
    const president = await this.prisma.president.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!president) {
      throw new UnauthorizedException("Account not found");
    }

    if (!president.isEnabled) {
      throw new UnauthorizedException("Account disabled ");
    }

    const isValid = await bcrypt.compare(password, president.password);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    return president;
  }

  async login(email: string, password: string) {
    const president = await this.validatePresident(email, password);
    return {
      accessToken: this.jwtService.sign({
        sub: president.id,
        email: president.email,
      }),
    };
  }

  private buildProfileResponse(president: PresidentWithRelations) {
    const presidentRecord = president as any;
    return {
      userId: presidentRecord.id,
      email: presidentRecord.email,
      name: presidentRecord.name,
      roleId: presidentRecord.roleId,
      roleName: presidentRecord.role?.name ?? null,
      isEnabled: presidentRecord.isEnabled,
      isSuperAdmin: presidentRecord.isSuperAdmin,
      permissions: Array.isArray(presidentRecord.role?.permissions)
        ? presidentRecord.role.permissions
        : [],
      memberId: presidentRecord.member?.id ?? null,
      fname: presidentRecord.member?.fname ?? null,
      lname: presidentRecord.member?.lname ?? null,
      mname: presidentRecord.member?.mname ?? null,
      bday: presidentRecord.member?.bday?.toISOString() ?? null,
      disability: presidentRecord.member?.disability ?? null,
      phoneNumber: presidentRecord.member?.phoneNumber ?? null,
      address: presidentRecord.member?.address ?? null,
      barangay: presidentRecord.member?.barangay ?? null,
      isBedridden: presidentRecord.member?.isBedridden ?? null,
      pwdId: presidentRecord.member?.pwdId ?? null,
      dateIssued: presidentRecord.member?.dateIssued?.toISOString() ?? null,
      gender: presidentRecord.member?.gender ?? null,
    };
  }

  async updateOwnProfile(userId: string, dto: UpdateProfileDto) {
    const existing = (await this.prisma.president.findUnique({
      where: { id: userId as any },
      include: { role: true, member: true },
    })) as PresidentWithRelations | null;

    if (!existing) {
      throw new NotFoundException("Account not found");
    }

    if (dto.email && dto.email !== existing.email) {
      const duplicate = await this.prisma.president.findUnique({
        where: { email: dto.email },
      });

      if (duplicate && duplicate.id !== (userId as any)) {
        throw new BadRequestException("Email is already in use");
      }
    }

    if (dto.pwdId && dto.pwdId !== existing.member?.pwdId) {
      const duplicatePwdId = await this.prisma.member.findUnique({
        where: { pwdId: dto.pwdId },
      });

      if (duplicatePwdId && duplicatePwdId.id !== existing.member?.id) {
        throw new BadRequestException("PWD ID is already in use");
      }
    }

    const password = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;

    const hasMemberProfileUpdates = [
      dto.fname,
      dto.lname,
      dto.mname,
      dto.bday,
      dto.disability,
      dto.phoneNumber,
      dto.address,
      dto.barangay,
      dto.isBedridden,
      dto.pwdId,
      dto.dateIssued,
      dto.gender,
    ].some((field) => field !== undefined);

    const updated = await this.prisma.$transaction(async (tx) => {
      const presidentUpdateData: Prisma.PresidentUpdateInput = {
        name: dto.name,
        email: dto.email,
        password,
      };

      if (hasMemberProfileUpdates) {
        if (existing.memberId && existing.member) {
          const memberUpdateData: Prisma.MemberUpdateInput = {
            fname: dto.fname,
            lname: dto.lname,
            mname: dto.mname,
            bday: dto.bday ? new Date(dto.bday) : undefined,
            disability: dto.disability,
            phoneNumber: dto.phoneNumber,
            address: dto.address,
            barangay: dto.barangay,
            isBedridden: dto.isBedridden,
            pwdId: dto.pwdId,
            dateIssued: dto.dateIssued ? new Date(dto.dateIssued) : undefined,
            gender: dto.gender,
          };

            await tx.member.update({
              where: { id: existing.memberId as any },
            data: memberUpdateData,
          });
        } else {
          const requiredForCreate = {
            fname: dto.fname,
            lname: dto.lname,
            bday: dto.bday,
            disability: dto.disability,
            phoneNumber: dto.phoneNumber,
            address: dto.address,
            barangay: dto.barangay,
            pwdId: dto.pwdId,
            gender: dto.gender,
          };

          const missingRequired = Object.entries(requiredForCreate)
            .filter(([, value]) => !value)
            .map(([key]) => key);

          if (missingRequired.length > 0) {
            throw new BadRequestException(
              `To create a profile member link, provide: ${missingRequired.join(", ")}`,
            );
          }

          const createdMember = await tx.member.create({
            data: {
              addedBy: { connect: { id: userId as any } },
              fname: dto.fname as string,
              lname: dto.lname as string,
              mname: dto.mname,
              bday: new Date(dto.bday as string),
              disability: dto.disability as string,
              phoneNumber: dto.phoneNumber as string,
              address: dto.address as string,
              barangay: dto.barangay as string,
              isBedridden: dto.isBedridden ?? false,
              pwdId: dto.pwdId as string,
              dateIssued: dto.dateIssued ? new Date(dto.dateIssued) : undefined,
              gender: dto.gender as string,
            },
          });

          presidentUpdateData.member = { connect: { id: createdMember.id } };
        }
      }

      return tx.president.update({
        where: { id: userId as any },
        data: presidentUpdateData,
        include: { role: true, member: true },
      });
    });

    return this.buildProfileResponse(updated);
  }
}
