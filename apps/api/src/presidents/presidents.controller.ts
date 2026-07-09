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
import { PresidentsService } from "./presidents.service";
import { CreatePresidentDto } from "./dto/create-president.dto";
import { UpdatePresidentDto } from "./dto/update-president.dto";

@Controller("presidents")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PresidentsController {
  private readonly logger = new Logger(PresidentsController.name);

  constructor(private readonly presidentsService: PresidentsService) {}

  @Get()
  @Permissions("accounts.manage")
  async findAll(@Query("page") page = "1", @Query("limit") limit = "10") {
    try {
      const pageNumber = Number(page) || 1;
      const pageSize = Number(limit) || 10;
      const result = await this.presidentsService.findAll(pageNumber, pageSize);
      this.logger.log(`Successfully fetched presidents page ${pageNumber}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while fetching presidents page ${page}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Post()
  @Permissions("accounts.manage")
  async create(@Body() createPresidentDto: CreatePresidentDto) {
    try {
      const result = await this.presidentsService.create(createPresidentDto);
      this.logger.log("Successfully created president");
      return result;
    } catch (error) {
      this.logger.error(
        "Issue while creating president",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Put(":id")
  @Permissions("accounts.manage")
  async update(
    @Param("id") id: string,
    @Body() updatePresidentDto: UpdatePresidentDto,
  ) {
    try {
      const presidentId = Number(id);
      const result = await this.presidentsService.update(
        presidentId,
        updatePresidentDto,
      );
      this.logger.log(`Successfully updated president ${presidentId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Issue while updating president ${id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
