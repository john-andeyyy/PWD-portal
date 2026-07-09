import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsInt,
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
  @IsInt()
  roleId?: number | null;

  @IsOptional()
  @IsInt()
  memberId?: number | null;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
