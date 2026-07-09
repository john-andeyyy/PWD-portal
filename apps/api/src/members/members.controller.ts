import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
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
  private readonly logger = new Logger(MembersController.name);

  constructor(private readonly membersService: MembersService) {}

  @Post()
  @Permissions("members.create")
  async create(@Request() req: any, @Body() createMemberDto: CreateMemberDto) {
    try {
      const result = await this.membersService.create(
        req.user.userId,
        createMemberDto,
      );
      this.logger.log(`Successfully created member for user ${req.user.userId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while creating member for user ${req.user.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Get()
  @Permissions("members.view")
  async findAll(
    @Request() req: any,
    @Query()
    query: {
      search?: string;
      barangay?: string;
      disability?: string;
      isBedridden?: string;
    },
  ) {
    try {
      const result = await this.membersService.findAll(req.user, query);
      this.logger.log(`Successfully fetched members for user ${req.user.userId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while fetching members for user ${req.user.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Get(":id")
  @Permissions("members.view")
  async findOne(@Request() req: any, @Param("id") id: string) {
    try {
      const memberId = Number(id);
      const result = await this.membersService.findOne(req.user, memberId);
      this.logger.log(
        `Successfully fetched member ${memberId} for user ${req.user.userId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while fetching member ${id} for user ${req.user.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Put(":id")
  @Permissions("members.update")
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    try {
      const memberId = Number(id);
      const result = await this.membersService.update(
        req.user,
        memberId,
        updateMemberDto,
      );
      this.logger.log(
        `Successfully updated member ${memberId} for user ${req.user.userId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while updating member ${id} for user ${req.user.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Delete(":id")
  @Permissions("members.delete")
  async remove(@Request() req: any, @Param("id") id: string) {
    try {
      const memberId = Number(id);
      const result = await this.membersService.remove(req.user, memberId);
      this.logger.log(
        `Successfully deleted member ${memberId} for user ${req.user.userId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while deleting member ${id} for user ${req.user.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
