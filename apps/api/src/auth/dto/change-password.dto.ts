import { IsString, Matches } from "class-validator";

const passwordMessage =
  "Use at least 8 characters with uppercase, lowercase, number, and symbol.";

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: passwordMessage,
  })
  newPassword: string;
}
