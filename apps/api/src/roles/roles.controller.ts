import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { Permissions } from "../auth/permissions.decorator";
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Controller("roles")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions("accounts.manage")
  async findAll(@Query("page") page = "1", @Query("limit") limit = "10") {
    try {
      const pageNumber = Number(page) || 1;
      const pageSize = Number(limit) || 10;
      const result = await this.rolesService.findAll(pageNumber, pageSize);
      this.logger.log(`Successfully fetched roles page ${pageNumber}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while fetching roles page ${page}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Post()
  @Permissions("accounts.manage")
  async create(@Body() createRoleDto: CreateRoleDto) {
    try {
      const result = await this.rolesService.create(createRoleDto);
      this.logger.log("Successfully created role");
      return result;
    } catch (error) {
      this.logger.error(
        "Issue while creating role",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Put(":id")
  @Permissions("accounts.manage")
  async update(@Param("id") id: string, @Body() updateRoleDto: UpdateRoleDto) {
    try {
      const roleId = Number(id);
      const result = await this.rolesService.update(roleId, updateRoleDto);
      this.logger.log(`Successfully updated role ${roleId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while updating role ${id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
