import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  expiresIn: number;

  @Expose()
  requiresTwoFactorAuth: boolean;

  @Expose()
  twoFactorAuthMethod?: 'app' | 'sms';

  @Expose()
  twoFactorAuthPhoneNumber?: string;

  @Expose()
  isNewUser?: boolean = false;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}

export class TwoFactorAuthResponseDto {
  @Expose()
  message: string;

  @Expose()
  tempToken: string;

  @Expose()
  twoFactorAuthMethod: 'app' | 'sms';

  @Expose()
  phoneNumber?: string;

  constructor(partial: Partial<TwoFactorAuthResponseDto>) {
    Object.assign(this, partial);
  }
}

export class RefreshTokenResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  expiresIn: number;

  constructor(partial: Partial<RefreshTokenResponseDto>) {
    Object.assign(this, partial);
  }
}

export class LogoutResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  constructor(partial: Partial<LogoutResponseDto>) {
    Object.assign(this, partial);
  }
}

export class VerifyEmailResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @Type(() => UserResponseDto)
  user?: UserResponseDto;

  constructor(partial: Partial<VerifyEmailResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ForgotPasswordResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  resetToken?: string;

  constructor(partial: Partial<ForgotPasswordResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ResetPasswordResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @Type(() => UserResponseDto)
  user?: UserResponseDto;

  constructor(partial: Partial<ResetPasswordResponseDto>) {
    Object.assign(this, partial);
  }
}
