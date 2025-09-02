import { Exclude, Expose, Type } from 'class-transformer';

export class RatingAspectResponseDto {
  @Expose()
  id: string;

  @Expose()
  aspect: string;

  @Expose()
  score: number;
}

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  profilePicture?: string;

  @Expose()
  isAnonymous: boolean;
}

export class StoreResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  logoUrl?: string;
}

export class RatingResponseDto {
  @Expose()
  id: string;

  @Expose()
  rating: number;

  @Expose()
  title?: string;

  @Expose()
  comment?: string;

  @Expose()
  @Type(() => RatingAspectResponseDto)
  ratingAspects: RatingAspectResponseDto[];

  @Expose()
  imageUrls: string[];

  @Expose()
  wouldRecommend?: boolean;

  @Expose()
  isEdited: boolean;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  @Type(() => StoreResponseDto)
  store: StoreResponseDto;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  likes: number = 0;

  @Expose()
  dislikes: number = 0;

  @Expose()
  userReaction?: 'like' | 'dislike' | null;

  @Exclude()
  userId: string;

  @Exclude()
  storeId: string;

  constructor(partial: Partial<RatingResponseDto>) {
    Object.assign(this, partial);
  }

  static fromRating(rating: any): RatingResponseDto {
    return new RatingResponseDto({
      id: rating.id,
      rating: rating.rating,
      title: rating.title,
      comment: rating.comment,
      ratingAspects: rating.ratingAspects || [],
      imageUrls: rating.imageUrls || [],
      wouldRecommend: rating.wouldRecommend,
      isEdited: rating.isEdited || false,
      user: {
        id: rating.user?.id || rating.userId,
        name: rating.isAnonymous ? 'Anonymous' : (rating.user?.name || 'Unknown User'),
        profilePicture: rating.isAnonymous ? null : (rating.user?.profilePicture),
        isAnonymous: rating.isAnonymous || false
      },
      store: rating.store ? {
        id: rating.store.id,
        name: rating.store.name,
        logoUrl: rating.store.logoUrl
      } : { id: rating.storeId, name: 'Unknown Store' },
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
      likes: rating.likes || 0,
      dislikes: rating.dislikes || 0,
      userReaction: rating.userReaction,
      userId: rating.userId,
      storeId: rating.storeId
    });
  }
}

export class RatingListResponseDto {
  @Expose()
  @Type(() => RatingResponseDto)
  ratings: RatingResponseDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;

  @Expose()
  averageRating: number;

  @Expose()
  ratingDistribution: Record<number, number>;

  constructor(ratings: RatingResponseDto[], total: number, page: number, limit: number, averageRating: number, ratingDistribution: Record<number, number>) {
    this.ratings = ratings;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.averageRating = averageRating;
    this.ratingDistribution = ratingDistribution;
  }
}
