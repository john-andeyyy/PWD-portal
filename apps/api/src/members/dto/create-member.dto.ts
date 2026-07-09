import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateMemberDto {
  @IsString()
  @MaxLength(80)
  fname: string;

  @IsString()
  @MaxLength(80)
  lname: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  mname?: string;

  @IsDateString()
  bday: string;

  @IsString()
  @MaxLength(160)
  disability: string;

  @IsString()
  @MaxLength(40)
  phoneNumber: string;

  @IsString()
  @MaxLength(255)
  address: string;

  @IsString()
  @MaxLength(80)
  barangay: string;

  @IsBoolean()
  isBedridden: boolean;

  @IsString()
  @MaxLength(60)
  pwdId: string;

  @IsOptional()
  @IsDateString()
  dateIssued?: string;

  @IsString()
  @MaxLength(30)
  gender: string;
}
