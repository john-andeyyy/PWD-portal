import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
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
      const result = await this.authService.login(loginDto.email, loginDto.password);
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
      const result = {
        userId: req.user.userId,
        email: req.user.email,
        roleId: req.user.roleId,
        roleName: req.user.roleName,
        isEnabled: req.user.isEnabled,
        permissions: req.user.permissions,
      };
      this.logger.log(`Successfully fetched auth profile for user ${req.user.userId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while fetching auth profile for user ${req.user?.userId ?? "unknown"}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
