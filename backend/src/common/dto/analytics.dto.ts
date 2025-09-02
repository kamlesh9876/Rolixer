import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max } from 'class-validator';

export enum AnalyticsTimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

export enum AnalyticsMetric {
  TOTAL_USERS = 'totalUsers',
  NEW_USERS = 'newUsers',
  ACTIVE_USERS = 'activeUsers',
  TOTAL_STORES = 'totalStores',
  NEW_STORES = 'newStores',
  ACTIVE_STORES = 'activeStores',
  TOTAL_RATINGS = 'totalRatings',
  AVERAGE_RATING = 'averageRating',
  RATING_DISTRIBUTION = 'ratingDistribution',
  TOTAL_VISITS = 'totalVisits',
  AVERAGE_SESSION_DURATION = 'averageSessionDuration',
  BOUNCE_RATE = 'bounceRate',
  CONVERSION_RATE = 'conversionRate',
  REVENUE = 'revenue',
  AVERAGE_ORDER_VALUE = 'averageOrderValue'
}

export class AnalyticsQueryDto {
  @IsEnum(AnalyticsTimeRange)
  @IsOptional()
  range: AnalyticsTimeRange = AnalyticsTimeRange.MONTH;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString({ each: true })
  @IsOptional()
  metrics: string[] = [
    'totalUsers',
    'newUsers',
    'activeUsers',
    'totalStores',
    'newStores',
    'totalRatings',
    'averageRating'
  ];

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  limit?: number = 30;

  @IsString()
  @IsOptional()
  timezone?: string = 'UTC';
}

export class AnalyticsResponseDto {
  metrics: Record<string, any>;
  data: any[];
  startDate: string;
  endDate: string;
  timeRange: AnalyticsTimeRange;
  timezone: string;

  constructor(partial: Partial<AnalyticsResponseDto>) {
    Object.assign(this, partial);
  }
}

export class StoreAnalyticsQueryDto extends AnalyticsQueryDto {
  @IsString({ each: true })
  @IsOptional()
  metrics: string[] = [
    'totalRatings',
    'averageRating',
    'ratingDistribution',
    'totalVisits',
    'conversionRate',
    'revenue',
    'averageOrderValue'
  ];
}

export class UserAnalyticsQueryDto extends AnalyticsQueryDto {
  @IsString({ each: true })
  @IsOptional()
  metrics: string[] = [
    'ratingsGiven',
    'averageRatingGiven',
    'reviewsWritten',
    'helpfulVotes',
    'totalVisits',
    'favoriteStores',
    'lastActive'
  ];
}

export class RatingAnalyticsQueryDto extends AnalyticsQueryDto {
  @IsString({ each: true })
  @IsOptional()
  metrics: string[] = [
    'totalRatings',
    'averageRating',
    'ratingDistribution',
    'ratingTrend',
    'withComments',
    'withImages',
    'helpfulVotes'
  ];

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsBoolean()
  @IsOptional()
  withCommentsOnly?: boolean = false;

  @IsBoolean()
  @IsOptional()
  withImagesOnly?: boolean = false;
}

// Add this to fix the missing import
declare function IsBoolean(): (target: any, key: string) => void;
