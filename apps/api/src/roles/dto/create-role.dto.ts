import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateRoleDto {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  permissions?: string[];
}
