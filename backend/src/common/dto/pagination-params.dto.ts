import { 
  IsNumber, 
  IsOptional, 
  Min, 
  Max, 
  IsString, 
  IsEnum, 
  IsArray, 
  IsUUID,
  IsBoolean
} from 'class-validator';
import { Transform } from 'class-transformer';
import { StoreStatus } from '../../stores/entities/store.entity';

export class PaginationParamsDto {
  @IsNumber()
  @Min(1, { message: 'Page must be at least 1' })
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsOptional()
  page: number = 1;

  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Maximum limit is 100' })
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsOptional()
  limit: number = 10;

  @IsString()
  @IsOptional()
  sortBy: string = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  @IsString()
  @IsOptional()
  search?: string;
}

export class StoreFilterDto extends PaginationParamsDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value), { toClassOnly: true })
  categories?: string[];

  @IsNumber()
  @Min(0)
  @Max(5)
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  @IsOptional()
  minRating?: number;

  @IsBoolean()
  @Transform(({ value }) => value === 'true', { toClassOnly: true })
  @IsOptional()
  isFeatured?: boolean;

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus;

  @IsString()
  @IsOptional()
  ownerId?: string;
}

export class RatingFilterDto extends PaginationParamsDto {
  @IsUUID('4')
  @IsOptional()
  storeId?: string;

  @IsUUID('4')
  @IsOptional()
  userId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsOptional()
  rating?: number;

  @IsBoolean()
  @Transform(({ value }) => value === 'true', { toClassOnly: true })
  @IsOptional()
  withCommentsOnly: boolean = false;

  @IsBoolean()
  @Transform(({ value }) => value === 'true', { toClassOnly: true })
  @IsOptional()
  withImagesOnly: boolean = false;

  @IsBoolean()
  @Transform(({ value }) => value === 'true', { toClassOnly: true })
  @IsOptional()
  recommendedOnly: boolean = false;
}