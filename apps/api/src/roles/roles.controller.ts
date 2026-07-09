import {
  Body,
  Controller,
  Get,
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
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions("accounts.manage")
  findAll(@Query("page") page = "1", @Query("limit") limit = "10") {
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    return this.rolesService.findAll(pageNumber, pageSize);
  }

  @Post()
  @Permissions("accounts.manage")
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Put(":id")
  @Permissions("accounts.manage")
  update(@Param("id") id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(Number(id), updateRoleDto);
  }
}
