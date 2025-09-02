import { 
  IsString, 
  IsOptional, 
  Length, 
  IsEmail, 
  IsUrl, 
  IsArray, 
  IsBoolean, 
  IsNumber, 
  Min, 
  Max, 
  ValidateNested, 
  IsObject 
} from 'class-validator';
import { Type } from 'class-transformer';
import { StoreStatus } from '../entities/store.entity';

class BusinessHoursDto {
  @IsString()
  @IsOptional()
  monday?: { open: string; close: string };
  
  @IsString()
  @IsOptional()
  tuesday?: { open: string; close: string };
  
  @IsString()
  @IsOptional()
  wednesday?: { open: string; close: string };
  
  @IsString()
  @IsOptional()
  thursday?: { open: string; close: string };
  
  @IsString()
  @IsOptional()
  friday?: { open: string; close: string };
  
  @IsString()
  @IsOptional()
  saturday?: { open: string; close: string };
  
  @IsString()
  @IsOptional()
  sunday?: { open: string; close: string };
}

class LocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  lat?: number;
  
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  lng?: number;
  
  @IsString()
  @IsOptional()
  formattedAddress?: string;
}

export class UpdateStoreDto {
  @IsString()
  @Length(2, 100, { message: 'Store name must be between 2 and 100 characters' })
  @IsOptional()
  name?: string;

  @IsString()
  @Length(2, 400, { message: 'Address must be between 2 and 400 characters' })
  @IsOptional()
  address?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @IsString()
  @IsOptional()
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 digits' })
  phone?: string;

  @IsUrl({}, { message: 'Please provide a valid website URL' })
  @IsOptional()
  website?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  @IsOptional()
  businessHours?: BusinessHoursDto;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Return policy cannot exceed 1000 characters' })
  returnPolicy?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Shipping policy cannot exceed 1000 characters' })
  shippingPolicy?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Terms and conditions cannot exceed 1000 characters' })
  termsAndConditions?: string;

  // Note: We don't include averageRating and totalRatings here 
  // as they should be calculated, not directly updated
}
