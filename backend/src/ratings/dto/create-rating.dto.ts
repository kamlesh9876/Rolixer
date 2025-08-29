import { IsInt, Min, Max, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsUUID()
  storeId: string;
}
