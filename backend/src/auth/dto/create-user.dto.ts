import { IsString, IsEmail, Length, IsOptional, Matches, IsBoolean, IsArray, ValidateNested, IsEnum, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  STORE_OWNER = 'STORE_OWNER',
  ADMIN = 'ADMIN'
}

export class SecurityQuestionDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class CreateUserDto {
  @IsString()
  @Length(2, 60, { message: 'Name must be between 2 and 60 characters' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 characters' })
  @IsOptional()
  phone?: string;

  @IsString()
  @Length(8, 16, { message: 'Password must be between 8 and 16 characters' })
  @Matches(
    /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/,
    {
      message: 'Password must contain at least one uppercase letter and one special character',
    },
  )
  password: string;

  @IsString()
  @Length(8, 16, { message: 'Confirm password must be between 8 and 16 characters' })
  confirmPassword: string;

  @IsEnum(UserType, { message: 'Invalid user type' })
  userType: UserType;

  @IsString()
  @IsOptional()
  @Length(0, 400, { message: 'Address cannot exceed 400 characters' })
  address?: string;

  @IsString()
  @IsOptional()
  storeName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionDto)
  @IsOptional()
  securityQuestions?: SecurityQuestionDto[];

  @IsBoolean()
  @IsOptional()
  enable2FA?: boolean;

  @IsString()
  @IsOptional()
  @IsPhoneNumber('IN', { message: 'Please provide a valid phone number with country code (e.g., +91XXXXXXXXXX)' })
  phoneFor2FA?: string;
}
