import { IsEmail, IsNotEmpty, IsString, MinLength, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean = false;

  @IsString()
  @IsOptional()
  twoFactorCode?: string;
}

export class RegisterDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString({ message: 'Confirm password must be a string' })
  @IsNotEmpty({ message: 'Please confirm your password' })
  confirmPassword: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsNotEmpty({ message: 'User role is required' })
  role: UserRole;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  acceptTerms?: boolean = false;

  // Additional fields for store owners
  @IsString()
  @IsOptional()
  storeName?: string;

  @IsString()
  @IsOptional()
  storeDescription?: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;

  @IsString({ message: 'Confirm new password must be a string' })
  @IsNotEmpty({ message: 'Please confirm your new password' })
  confirmNewPassword: string;
}

export class VerifyEmailDto {
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}

export class ResendVerificationEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class TwoFactorAuthDto {
  @IsString()
  @IsNotEmpty({ message: 'Code is required' })
  code: string;
}

export class EnableTwoFactorAuthDto {
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  method?: 'app' | 'sms' = 'app';
}

export class VerifyTwoFactorAuthDto {
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsString()
  @IsOptional()
  method?: 'app' | 'sms' = 'app';

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
