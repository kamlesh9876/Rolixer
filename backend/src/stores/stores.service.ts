import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, In } from 'typeorm';
import { Store } from './entities/store.entity';
import { User } from '../users/entities/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UserRole } from '../users/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

type StoreQueryOptions = {
  search?: string;
  status?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
};

@Injectable()
export class StoresService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly RATING_CACHE_PREFIX = 'store_rating_';
  private readonly STORE_CACHE_PREFIX = 'store_';
  private readonly STORE_LIST_CACHE_PREFIX = 'store_list_';

  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private getStoreCacheKey(storeId: string): string {
    return `${this.STORE_CACHE_PREFIX}${storeId}`;
  }

  private async clearStoreListCache(): Promise<void> {
    const client = (this.cacheManager as any).store.getClient();
    if (client && typeof client.keys === 'function') {
      const keys = await client.keys(`${this.STORE_LIST_CACHE_PREFIX}*`);
      await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
    }
  }

  private getStoreListCacheKey(query: any): string {
    const queryString = Object.entries(query)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return `${this.STORE_LIST_CACHE_PREFIX}${queryString}`;
  }

  private getRatingCacheKey(storeId: string): string {
    return `${this.RATING_CACHE_PREFIX}${storeId}`;
  }

  async create(createStoreDto: CreateStoreDto, userId: string): Promise<Store> {
    const owner = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Check if user has permission to create a store
    if (owner.role !== UserRole.ADMIN && owner.role !== UserRole.STORE_OWNER) {
      throw new ForbiddenException('Only admins and store owners can create stores');
    }

    const store = this.storesRepository.create({
      ...createStoreDto,
      owner,
    });

    return this.storesRepository.save(store);
  }

  async findAll(query: StoreQueryOptions = {}): Promise<{ data: Store[]; total: number }> {
    const cacheKey = this.getStoreListCacheKey(query);
    const cached = await this.cacheManager.get<{ data: Store[]; total: number }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const {
      search,
      status,
      ownerId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;
    const where: FindManyOptions<Store>['where'] = {};

    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (status) {
      where.status = status as any;
    }

    if (ownerId) {
      where.owner = { id: ownerId };
    }

    const [data, total] = await this.storesRepository.findAndCount({
      where,
      relations: ['owner'],
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const result = { data, total };
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findOne(id: string, includeRatings = true): Promise<Store> {
    const cacheKey = this.getStoreCacheKey(id);
    const cachedStore = await this.cacheManager.get<Store>(cacheKey);
    
    if (cachedStore) {
      return cachedStore;
    }

    const store = await this.storesRepository.findOne({
      where: { id },
      relations: includeRatings ? ['owner', 'ratings', 'ratings.user'] : ['owner'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    // Cache the store without ratings to keep the cache small
    if (includeRatings) {
      const { ratings, ...storeWithoutRatings } = store;
      await this.cacheManager.set(cacheKey, storeWithoutRatings, this.CACHE_TTL);
    } else {
      await this.cacheManager.set(cacheKey, store, this.CACHE_TTL);
    }

    return store;
  }

  async calculateStoreRating(storeId: string): Promise<{ average: number; count: number }> {
    const cacheKey = this.getRatingCacheKey(storeId);
    const cachedRating = await this.cacheManager.get<{ average: number; count: number }>(cacheKey);
    
    if (cachedRating) {
      return cachedRating;
    }

    const result = await this.storesRepository
      .createQueryBuilder('store')
      .select('AVG(rating.rating)', 'average')
      .addSelect('COUNT(rating.id)', 'count')
      .leftJoin('store.ratings', 'rating')
      .where('store.id = :storeId', { storeId })
      .groupBy('store.id')
      .getRawOne();

    const rating = {
      average: result ? parseFloat(parseFloat(result.average || '0').toFixed(2)) : 0,
      count: result ? parseInt(result.count, 10) : 0,
    };

    await this.cacheManager.set(cacheKey, rating, this.CACHE_TTL);
    return rating;
  }

  async getStoresWithRatings(storeIds: string[]): Promise<Map<string, { average: number; count: number }>> {
    const result = new Map<string, { average: number; count: number }>();
    
    // Check cache first
    const cachedRatings = await Promise.all(
      storeIds.map(id => 
        this.cacheManager.get<{ average: number; count: number }>(this.getRatingCacheKey(id))
          .then(rating => rating ? { id, rating } : null)
      )
    );

    // Process cached ratings
    const cachedIds = new Set<string>();
    for (const item of cachedRatings) {
      if (item) {
        result.set(item.id, item.rating);
        cachedIds.add(item.id);
      }
    }

    // Find uncached store IDs
    const uncachedIds = storeIds.filter(id => !cachedIds.has(id));
    
    if (uncachedIds.length > 0) {
      // Batch query for uncached ratings
      const ratings = await this.storesRepository
        .createQueryBuilder('store')
        .select('store.id', 'storeId')
        .addSelect('AVG(rating.rating)', 'average')
        .addSelect('COUNT(rating.id)', 'count')
        .leftJoin('store.ratings', 'rating')
        .where('store.id IN (:...ids)', { ids: uncachedIds })
        .groupBy('store.id')
        .getRawMany();

      // Process and cache the results
      for (const rating of ratings) {
        const ratingData = {
          average: parseFloat(parseFloat(rating.average || '0').toFixed(2)),
          count: parseInt(rating.count, 10),
        };
        
        result.set(rating.storeId, ratingData);
        await this.cacheManager.set(
          this.getRatingCacheKey(rating.storeId), 
          ratingData, 
          this.CACHE_TTL
        );
      }
    }

    return result;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto, userId: string): Promise<Store> {
    const store = await this.findOne(id, false);
    
    // Invalidate cache
    await Promise.all([
      this.cacheManager.del(this.getStoreCacheKey(id)),
      this.cacheManager.del(this.getRatingCacheKey(id)),
      this.clearStoreListCache(),
    ]);
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is admin or the store owner
    if (user.role !== UserRole.ADMIN && store.owner.id !== userId) {
      throw new ForbiddenException('You do not have permission to update this store');
    }

    // If updating owner, verify the new owner exists and is a store owner
    if (updateStoreDto.ownerId && updateStoreDto.ownerId !== store.owner.id) {
      const newOwner = await this.usersRepository.findOne({
        where: { id: updateStoreDto.ownerId, role: UserRole.STORE_OWNER },
      });

      if (!newOwner) {
        throw new NotFoundException('New store owner not found or is not a store owner');
      }

      store.owner = newOwner;
    }

    Object.assign(store, updateStoreDto);
    return this.storesRepository.save(store);
  }

  async remove(id: string, userId: string): Promise<void> {
    const store = await this.findOne(id);
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only allow admin or the store owner to delete
    if (user.role !== UserRole.ADMIN && store.owner.id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this store');
    }

    await this.storesRepository.remove(store);
  }

  async getStoreRatings(storeId: string) {
    const store = await this.storesRepository.findOne({
      where: { id: storeId },
      relations: ['ratings', 'ratings.user'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    return store.ratings;
  }
}
