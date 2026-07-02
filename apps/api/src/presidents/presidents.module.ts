import { Module } from "@nestjs/common";
import { PresidentsController } from "./presidents.controller";
import { PresidentsService } from "./presidents.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [PresidentsController],
  providers: [PresidentsService],
})
export class PresidentsModule {}
