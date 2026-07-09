import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
} from "class-validator";

export class UpdatePresidentDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string | null;

  @IsOptional()
  @IsUUID()
  memberId?: string | null;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;
}
