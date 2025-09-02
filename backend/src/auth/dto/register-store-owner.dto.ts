import { Type } from 'class-transformer';
import { 
  IsString, 
  IsEmail, 
  MinLength, 
  MaxLength, 
  IsOptional, 
  IsPhoneNumber, 
  ValidateNested, 
  IsObject, 
  IsNotEmpty,
  Matches 
} from 'class-validator';
import { CreateStoreDto } from '../../stores/dto/create-store.dto';

export class RegisterStoreOwnerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  confirmPassword: string;

  @IsString()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  @IsOptional()
  phone?: string;

  @IsString()
  @MaxLength(400)
  @IsOptional()
  address?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => CreateStoreDto)
  store: CreateStoreDto;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;
}
