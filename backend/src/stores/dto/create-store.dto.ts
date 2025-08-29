import { IsString, IsEmail, IsOptional, IsEnum, Length } from 'class-validator';
import { StoreStatus } from '../entities/store.entity';

export class CreateStoreDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(2, 400)
  address: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus = StoreStatus.PENDING;

  @IsString()
  ownerId: string;
}
