import { 
  IsInt, 
  Min, 
  Max, 
  IsString, 
  IsOptional, 
  IsUUID, 
  IsNotEmpty, 
  Length, 
  IsArray, 
  ArrayMinSize, 
  ArrayMaxSize,
  IsBoolean
} from 'class-validator';

export class CreateRatingDto {
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Minimum rating is 1' })
  @Max(5, { message: 'Maximum rating is 5' })
  @IsNotEmpty({ message: 'Rating is required' })
  rating: number;

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Comment cannot exceed 1000 characters' })
  comment?: string;

  @IsUUID('4', { message: 'Invalid store ID format' })
  @IsNotEmpty({ message: 'Store ID is required' })
  storeId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one rating aspect is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 rating aspects allowed' })
  @IsOptional()
  ratingAspects?: Array<{
    aspect: string;
    score: number;
  }>;

  @IsBoolean()
  @IsOptional()
  anonymous?: boolean = false;

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
}
