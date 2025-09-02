import { 
  IsInt, 
  Min, 
  Max, 
  IsString, 
  IsOptional, 
  Length, 
  IsArray, 
  ArrayMinSize, 
  ArrayMaxSize,
  IsBoolean,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

class RatingAspectDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  aspect?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  score?: number;
}

export class UpdateRatingDto {
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Minimum rating is 1' })
  @Max(5, { message: 'Maximum rating is 5' })
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Comment cannot exceed 1000 characters' })
  comment?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingAspectDto)
  @IsOptional()
  ratingAspects?: RatingAspectDto[];

  @IsBoolean()
  @IsOptional()
  anonymous?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(5, { message: 'Maximum 5 images allowed' })
  imageUrls?: string[];

  @IsBoolean()
  @IsOptional()
  wouldRecommend?: boolean;

  @IsString()
  @IsOptional()
  @Length(0, 100, { message: 'Title cannot exceed 100 characters' })
  title?: string;

  @IsBoolean()
  @IsOptional()
  isEdited?: boolean;
}
