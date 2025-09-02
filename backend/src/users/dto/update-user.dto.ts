import { 
  IsString, 
  IsOptional, 
  Length, 
  IsEmail, 
  IsEnum, 
  IsNotEmpty, 
  Matches, 
  IsBoolean, 
  IsArray, 
  ValidateNested,
  IsPhoneNumber
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

class SecurityQuestionDto {
  @IsString()
  @IsNotEmpty()
  id?: string;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @Length(2, 60, { message: 'Name must be between 2 and 60 characters' })
  name?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(0, 400, { message: 'Address cannot exceed 400 characters' })
  address?: string;

  @IsString()
  @IsOptional()
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 digits' })
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  twoFactorEnabled?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionDto)
  @IsOptional()
  securityQuestions?: SecurityQuestionDto[];

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Profile bio cannot exceed 1000 characters' })
  profileBio?: string;

  @IsString()
  @IsOptional()
  @Length(0, 200, { message: 'Profile picture URL cannot exceed 200 characters' })
  profilePicture?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Please confirm your new password' })
  confirmNewPassword: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(2, 60, { message: 'Name must be between 2 and 60 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  @Length(0, 400, { message: 'Address cannot exceed 400 characters' })
  address?: string;

  @IsString()
  @IsOptional()
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 digits' })
  phone?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Profile bio cannot exceed 1000 characters' })
  bio?: string;

  @IsString()
  @IsOptional()
  @Length(0, 200, { message: 'Profile picture URL cannot exceed 200 characters' })
  profilePicture?: string;
}

export class UpdateSecurityQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionDto)
  @IsNotEmpty({ message: 'At least one security question is required' })
  securityQuestions: SecurityQuestionDto[];
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Please confirm your new password' })
  confirmNewPassword: string;
}
