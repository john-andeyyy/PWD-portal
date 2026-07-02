import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validatePresident(email: string, password: string) {
    const president = await this.prisma.president.findUnique({
      where: { email },
    });
    if (!president) {
      throw new UnauthorizedException("Invalid credentials.");
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
}
