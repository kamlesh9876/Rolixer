import { PartialType } from '@nestjs/mapped-types';
import { CreateRatingDto } from './create-rating.dto';
import { IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class UpdateRatingDto extends PartialType(CreateRatingDto) {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
