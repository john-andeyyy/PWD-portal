import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { getPermissionCatalog } from "./permissions.catalog";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get("permissions")
  getPermissions() {
    return getPermissionCatalog();
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(
        loginDto.email,
        loginDto.password,
      );
      this.logger.log(`Successfully logged in ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while logging in ${loginDto.email}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@Request() req: any) {
    try {
      const member = req.user.member ?? null;
      const result = {
        userId: req.user.userId,
        email: req.user.email,
        name: req.user.name,
        roleId: req.user.roleId,
        roleName: req.user.roleName,
        isEnabled: req.user.isEnabled,
        isSuperAdmin: req.user.isSuperAdmin,
        permissions: req.user.permissions,
        memberId: member?.id ?? null,
        fname: member?.fname ?? null,
        lname: member?.lname ?? null,
        mname: member?.mname ?? null,
        bday: member?.bday?.toISOString() ?? null,
        disability: member?.disability ?? null,
        phoneNumber: member?.phoneNumber ?? null,
        address: member?.address ?? null,
        barangay: member?.barangay ?? null,
        isBedridden: member?.isBedridden ?? null,
        pwdId: member?.pwdId ?? null,
        dateIssued: member?.dateIssued?.toISOString() ?? null,
        gender: member?.gender ?? null,
      };
      this.logger.log(
        `Successfully fetched auth profile for user ${req.user.userId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while fetching auth profile for user ${req.user?.userId ?? "unknown"}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put("profile")
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    try {
      const result = await this.authService.updateOwnProfile(
        req.user.userId,
        dto,
      );
      this.logger.log(
        `Successfully updated auth profile for user ${req.user.userId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while updating auth profile for user ${req.user?.userId ?? "unknown"}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
