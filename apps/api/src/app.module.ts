import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { MembersModule } from "./members/members.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PresidentsModule } from "./presidents/presidents.module";
import { RolesModule } from "./roles/roles.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MembersModule,
    PresidentsModule,
    RolesModule,
  ],
})
export class AppModule {}
