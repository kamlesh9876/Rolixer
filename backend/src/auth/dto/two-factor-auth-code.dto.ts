import { IsNotEmpty, IsString, Length } from 'class-validator';

export class TwoFactorAuthCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: '2FA code must be 6 digits' })
  code: string;

  @IsString()
  @IsNotEmpty()
  tempToken: string;
}
