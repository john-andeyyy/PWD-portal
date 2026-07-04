import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  fname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  mname?: string;

  @IsOptional()
  @IsDateString()
  bday?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  disability?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  barangay?: string;

  @IsOptional()
  @IsBoolean()
  isBedridden?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  pwdId?: string;

  @IsOptional()
  @IsDateString()
  dateIssued?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  gender?: string;
}
