import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { Permissions } from "../auth/permissions.decorator";
import { MembersService } from "./members.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";

@Controller("members")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @Permissions("members.create")
  create(@Request() req: any, @Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(req.user.userId, createMemberDto);
  }

  @Get()
  @Permissions("members.view")
  findAll(@Request() req: any) {
    return this.membersService.findAll(req.user.userId);
  }

  @Get(":id")
  @Permissions("members.view")
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.membersService.findOne(req.user.userId, Number(id));
  }

  @Put(":id")
  @Permissions("members.update")
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(
      req.user.userId,
      Number(id),
      updateMemberDto,
    );
  }

  @Delete(":id")
  @Permissions("members.delete")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.membersService.remove(req.user.userId, Number(id));
  }
}
