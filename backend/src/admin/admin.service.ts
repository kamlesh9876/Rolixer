import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { AdminDashboardStats, UserListResponse, StoreListResponse } from './dto/admin-dashboard.dto';
import { UserRole } from '../users/entities/user.entity';
import { Like } from 'typeorm';
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
  ) {}

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [
      totalUsers,
      totalStores,
      totalRatings,
      recentUsers,
      recentStores,
      ratingsDistribution
    ] = await Promise.all([
      this.usersRepository.count(),
      this.storesRepository.count(),
      this.ratingsRepository.count(),
      this.usersRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
        select: ['id', 'name', 'email', 'role', 'createdAt']
      }),
      this.storesRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['owner']
      }),
      this.ratingsRepository
        .createQueryBuilder('rating')
        .select('rating.rating, COUNT(*) as count')
        .groupBy('rating.rating')
        .getRawMany()
    ]);

    // Format ratings distribution
    const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    ratingsDistribution.forEach(item => {
      distribution[item.rating] = parseInt(item.count);
    });

    return {
      totalUsers,
      totalStores,
      totalRatings,
      recentUsers,
      recentStores,
      ratingsDistribution: distribution
    };
  }

  async getUsers(
    page = 1,
    limit = 10,
    search = '',
    role?: UserRole,
  ): Promise<UserListResponse> {
    const skip = (page - 1) * limit;
    const where: any = {};
    
    if (search) {
      where.name = Like(`%${search}%`);
    }
    
    if (role) {
      where.role = role;
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'email', 'role', 'createdAt', 'lastLogin']
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getStores(
    page = 1,
    limit = 10,
    search = '',
  ): Promise<StoreListResponse> {
    const skip = (page - 1) * limit;
    const query = this.storesRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.owner', 'owner')
      .orderBy('store.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      query.where('store.name LIKE :search', { search: `%${search}%` })
           .orWhere('store.address LIKE :search', { search: `%${search}%` });
    }

    const [stores, total] = await query.getManyAndCount();

    return {
      data: stores,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getStoreRatings(storeId: string) {
    const store = await this.storesRepository.findOne({
      where: { id: storeId },
      relations: ['ratings', 'ratings.user']
    });

    if (!store) {
      throw new Error('Store not found');
    }

    return store.ratings;
  }
}
