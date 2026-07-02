import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsBoolean()
  canCreateMembers?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewMembers?: boolean;

  @IsOptional()
  @IsBoolean()
  canUpdateMembers?: boolean;

  @IsOptional()
  @IsBoolean()
  canDeleteMembers?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageRoles?: boolean;
}
