import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreDto } from './create-store.dto';
import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @IsString()
  @Length(2, 100)
  @IsOptional()
  name?: string;

  @IsString()
  @Length(2, 400)
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsString()
  @IsOptional()
  ownerId?: string;
}
