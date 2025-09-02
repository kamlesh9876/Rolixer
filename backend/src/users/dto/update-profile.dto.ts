import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  MinLength, 
  MaxLength, 
  IsPhoneNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

class SecurityQuestionDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User full name',
    minLength: 2,
    maxLength: 60,
    required: false
  })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'User email address',
    format: 'email',
    required: false
  })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'User phone number',
    required: false
  })
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'User address',
    maxLength: 400,
    required: false
  })
  @IsString()
  @MaxLength(400)
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    required: false
  })
  @IsEnum(UserRole, { message: 'Invalid role' })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    description: 'Whether the user is active',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Security questions for password recovery',
    type: [SecurityQuestionDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionDto)
  @IsOptional()
  securityQuestions?: SecurityQuestionDto[];

  @ApiProperty({
    description: 'Whether two-factor authentication is enabled',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  twoFactorEnabled?: boolean;

  @ApiProperty({
    description: 'User preferences',
    type: 'object',
    required: false
  })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}
