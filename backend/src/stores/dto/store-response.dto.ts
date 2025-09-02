import { Exclude, Expose, Type } from 'class-transformer';
import { StoreStatus } from '../entities/store.entity';

class BusinessHoursDto {
  @Expose()
  monday?: { open: string; close: string };

  @Expose()
  tuesday?: { open: string; close: string };

  @Expose()
  wednesday?: { open: string; close: string };

  @Expose()
  thursday?: { open: string; close: string };

  @Expose()
  friday?: { open: string; close: string };

  @Expose()
  saturday?: { open: string; close: string };

  @Expose()
  sunday?: { open: string; close: string };
}

class LocationDto {
  @Expose()
  lat: number;

  @Expose()
  lng: number;

  @Expose()
  formattedAddress: string;
}

class StoreOwnerDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;
}

export class StoreResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  address: string;

  @Expose()
  email: string;

  @Expose()
  description: string;

  @Expose()
  phone: string;

  @Expose()
  website: string;

  @Expose()
  @Type(() => BusinessHoursDto)
  businessHours: BusinessHoursDto;

  @Expose()
  @Type(() => LocationDto)
  location: LocationDto;

  @Expose()
  categories: string[];

  @Expose()
  averageRating: number = 0;

  @Expose()
  totalRatings: number = 0;

  @Expose()
  isFeatured: boolean = false;

  @Expose()
  status: StoreStatus;

  @Expose()
  logoUrl: string;

  @Expose()
  imageUrls: string[] = [];

  @Expose()
  returnPolicy: string;

  @Expose()
  shippingPolicy: string;

  @Expose()
  termsAndConditions: string;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @Exclude()
  ownerId: string;

  @Expose()
  @Type(() => StoreOwnerDto)
  owner: StoreOwnerDto | null;

  constructor(partial: Partial<StoreResponseDto>) {
    Object.assign(this, partial);
  }

  static fromStore(store: any): StoreResponseDto {
    return new StoreResponseDto({
      ...store,
      categories: store.categories || [],
      averageRating: store.averageRating || 0,
      totalRatings: store.totalRatings || 0,
      isFeatured: store.isFeatured || false,
      imageUrls: store.imageUrls || [],
      owner: store.owner ? {
        id: store.owner.id,
        name: store.owner.name,
        email: store.owner.email
      } : null
    });
  }
}

export class StoreListResponseDto {
  @Expose()
  @Type(() => StoreResponseDto)
  items: StoreResponseDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;

  constructor(items: StoreResponseDto[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / Math.max(1, limit));
  }

  static fromStoresAndPagination(
    stores: StoreResponseDto[],
    total: number,
    page: number,
    limit: number
  ): StoreListResponseDto {
    return new StoreListResponseDto(stores, total, page, limit);
  }
}