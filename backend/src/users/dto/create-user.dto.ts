import { 
  IsString, 
  IsEmail, 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  Length, 
  Matches, 
  IsPhoneNumber, 
  IsBoolean, 
  ValidateNested, 
  IsArray,
  MinLength,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

class SecurityQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 60, { message: 'Name must be between 2 and 60 characters' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Please confirm your password' })
  confirmPassword: string;

  @IsString()
  @IsOptional()
  @Length(0, 400, { message: 'Address cannot exceed 400 characters' })
  address?: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;

  @IsString()
  @IsOptional()
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 digits' })
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean = false;

  @IsBoolean()
  @IsOptional()
  twoFactorEnabled?: boolean = false;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionDto)
  @IsOptional()
  securityQuestions?: SecurityQuestionDto[];

  // Additional fields for store owners
  @IsString()
  @IsOptional()
  @Length(2, 100, { message: 'Store name must be between 2 and 100 characters' })
  storeName?: string;

  @IsString()
  @IsOptional()
  @Length(0, 400, { message: 'Store address cannot exceed 400 characters' })
  storeAddress?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Store description cannot exceed 1000 characters' })
  storeDescription?: string;
}
