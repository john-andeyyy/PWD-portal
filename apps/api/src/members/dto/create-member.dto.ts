import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
