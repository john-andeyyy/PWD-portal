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
import { MembersService } from "./members.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";

@Controller("members")
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Request() req: any, @Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(req.user.userId, createMemberDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.membersService.findAll(req.user.userId);
  }

  @Get(":id")
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.membersService.findOne(req.user.userId, Number(id));
  }

  @Put(":id")
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
  remove(@Request() req: any, @Param("id") id: string) {
    return this.membersService.remove(req.user.userId, Number(id));
  }
}
