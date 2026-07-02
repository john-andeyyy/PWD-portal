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
import { PresidentsService } from "./presidents.service";
import { CreatePresidentDto } from "./dto/create-president.dto";
import { UpdatePresidentDto } from "./dto/update-president.dto";

@Controller("presidents")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PresidentsController {
  constructor(private readonly presidentsService: PresidentsService) {}

  @Get()
  @Permissions("canManageRoles")
  findAll(@Query("page") page = "1", @Query("limit") limit = "10") {
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    return this.presidentsService.findAll(pageNumber, pageSize);
  }

  @Post()
  @Permissions("canManageRoles")
  create(@Body() createPresidentDto: CreatePresidentDto) {
    return this.presidentsService.create(createPresidentDto);
  }

  @Put(":id")
  @Permissions("canManageRoles")
  update(
    @Param("id") id: string,
    @Body() updatePresidentDto: UpdatePresidentDto,
  ) {
    return this.presidentsService.update(Number(id), updatePresidentDto);
  }
}
