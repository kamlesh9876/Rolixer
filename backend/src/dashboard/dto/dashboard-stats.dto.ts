import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  userCount: number;

  @ApiProperty({ description: 'Total number of stores' })
  storeCount: number;

  @ApiProperty({ description: 'Total number of ratings' })
  ratingCount: number;

  @ApiProperty({ 
    type: 'array',
    description: 'Recent users',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  }>;

  @ApiProperty({ 
    type: 'array',
    description: 'Recent ratings',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        rating: { type: 'number' },
        comment: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          }
        },
        store: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          }
        }
      }
    }
  })
  recentRatings: Array<{
    id: string;
    rating: number;
    comment?: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
    };
    store: {
      id: string;
      name: string;
    };
  }>;
}
