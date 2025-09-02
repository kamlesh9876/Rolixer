import { IsString, IsOptional, IsNumber, Min, Max, IsArray, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SearchSortBy {
  RELEVANCE = 'relevance',
  RATING = 'rating',
  DISTANCE = 'distance',
  NEWEST = 'newest',
  REVIEW_COUNT = 'reviewCount'
}

export class SearchQueryDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  categories?: string[];

  @IsNumber()
  @Min(0)
  @Max(5)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  minRating?: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  maxDistance?: number; // in kilometers or miles

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  lat?: number;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  lng?: number;

  @IsEnum(SearchSortBy)
  @IsOptional()
  sortBy: SearchSortBy = SearchSortBy.RELEVANCE;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  page: number = 1;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  limit: number = 10;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  featuredOnly: boolean = false;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  openNow: boolean = false;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  tags?: string[];

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  minReviewCount?: number;
}

// Add this to fix the missing import
declare function IsBoolean(): (target: any, key: string) => void;
