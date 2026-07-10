import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  fname: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lname: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  mname?: string;

  @IsDateString()
  bday: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  disability: string;

  @IsString()
  @Matches(/^09\d{9}$/, {
    message: "Enter a valid 11-digit mobile number starting with 09.",
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  barangay: string;

  @IsBoolean()
  isBedridden: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  pwdId: string;

  @IsOptional()
  @IsDateString()
  dateIssued?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  gender: string;
}
