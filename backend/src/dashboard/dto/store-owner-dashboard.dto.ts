import { ApiProperty } from '@nestjs/swagger';

export class StoreOwnerDashboardDto {
  @ApiProperty({
    description: 'Store information',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      totalRatings: { type: 'number' },
      averageRating: { type: 'number', format: 'float' },
      ratingDistribution: { 
        type: 'array',
        items: { type: 'number' }
      },
    },
    additionalProperties: false
  })
  store: {
    id: string;
    name: string;
    totalRatings: number;
    averageRating: number;
    ratingDistribution: number[];
  };

  @ApiProperty({
    type: 'array',
    description: 'Recent ratings for the store',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        rating: { type: 'number' },
        comment: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        userName: { type: 'string' },
      },
    },
  })
  recentRatings: Array<{
    id: string;
    rating: number;
    comment?: string;
    createdAt: Date;
    userName: string;
  }>;
}
