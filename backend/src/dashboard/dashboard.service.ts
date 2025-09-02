import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Rating } from '../ratings/entities/rating.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
  ) {}

  async getDashboardStats() {
    try {
      const [userCount, storeCount, ratingCount] = await Promise.all([
        this.usersRepository.count(),
        this.storesRepository.count(),
        this.ratingsRepository.count(),
      ]);

      const recentUsers = await this.usersRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
        select: ['id', 'name', 'email', 'role', 'createdAt'],
      });

      const recentRatings = await this.ratingsRepository.find({
        relations: ['user', 'store'],
        order: { createdAt: 'DESC' },
        take: 5,
      });

      return {
        userCount,
        storeCount,
        ratingCount,
        recentUsers,
        recentRatings,
      };
    } catch (error) {
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  async getStoreOwnerDashboard(storeId: string) {
    try {
      const store = await this.storesRepository.findOne({
        where: { id: storeId },
        relations: ['ratings', 'ratings.user'],
      });
      if (!store) {
        throw new Error('Store not found');
      }

      const totalRatings = store.ratings.length;
      const averageRating = totalRatings > 0
        ? store.ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings
        : 0;

      const ratingDistribution = [0, 0, 0, 0, 0]; // For 1-5 stars
      store.ratings.forEach((rating) => {
        ratingDistribution[rating.rating - 1]++;
      });

      return {
        store: {
          id: store.id,
          name: store.name,
          totalRatings,
          averageRating: parseFloat(averageRating.toFixed(2)),
          ratingDistribution,
        },
        recentRatings: store.ratings
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
          .map(rating => ({
            id: rating.id,
            rating: rating.rating,
            comment: rating.comment,
            createdAt: rating.createdAt,
            userName: rating.user?.name || 'Anonymous',
          })),
      };
    } catch (error) {
      throw new Error('Failed to fetch store owner dashboard');
    }
  }
}
