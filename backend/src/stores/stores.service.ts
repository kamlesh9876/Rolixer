import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  Inject, 
  BadRequestException,
  Logger,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, In, Not, IsNull, FindOptionsWhere, QueryFailedError } from 'typeorm';
import { Store, StoreStatus } from './entities/store.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { RedisClientType } from 'redis';

type StoreQueryOptions = {
  search?: string;
  status?: StoreStatus;
  ownerId?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof Store;
  sortOrder?: 'ASC' | 'DESC';
  includeInactive?: boolean;
};

type StoreListResult = {
  data: Store[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type StoreRating = {
  average: number;
  count: number;
};

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly RATING_CACHE_PREFIX = 'store_rating:';
  private readonly STORE_CACHE_PREFIX = 'store:';
  private readonly STORE_LIST_CACHE_PREFIX = 'store_list:';
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly MAX_PAGE_SIZE = 100;

  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache & { 
      store: { 
        getClient: () => RedisClientType;
        del: (...keys: string[]) => Promise<void>;
      } 
    }
  ) {}

  private getStoreCacheKey(storeId: string): string {
    return `${this.STORE_CACHE_PREFIX}${storeId}`;
  }

  private getRatingCacheKey(storeId: string): string {
    return `${this.RATING_CACHE_PREFIX}${storeId}`;
  }

  private getStoreListCacheKey(query: StoreQueryOptions): string {
    const { 
      search, 
      status, 
      ownerId, 
      page = 1, 
      limit = this.DEFAULT_PAGE_SIZE,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeInactive = false
    } = query;

    const cacheKeyParts = [
      this.STORE_LIST_CACHE_PREFIX,
      `s:${search || ''}`,
      `st:${status || ''}`,
      `o:${ownerId || ''}`,
      `p:${page}`,
      `l:${limit}`,
      `sb:${sortBy}`,
      `so:${sortOrder}`,
      `ii:${includeInactive ? '1' : '0'}`
    ];

    return cacheKeyParts.join('|');
  }

  private async clearStoreListCache(): Promise<void> {
    try {
      const client = this.cacheManager.store.getClient();
      if (!('keys' in client)) {
        return;
      }
      const keys = await client.keys(`${this.STORE_LIST_CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.cacheManager.store.del(...keys);
      }
    } catch (error) {
      this.logger.error('Error clearing store list cache', error);
    }
  }

  private async getCached<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value !== undefined ? value : null;
    } catch (error) {
      this.logger.error(`Cache get failed for key ${key}`, error);
      return null;
    }
  }

  private async setCached<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl ?? this.CACHE_TTL * 1000);
    } catch (error) {
      this.logger.error(`Cache set failed for key ${key}`, error);
    }
  }

  private async deleteCached(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Cache delete failed for key ${key}`, error);
    }
  }

  private validatePaginationParams(page: number, limit: number): void {
    if (page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }
    if (limit < 1 || limit > this.MAX_PAGE_SIZE) {
      throw new BadRequestException(`Limit must be between 1 and ${this.MAX_PAGE_SIZE}`);
    }
  }

  async create(createStoreDto: CreateStoreDto, userId: string): Promise<Store> {
    const owner = await this.usersRepository.findOne({ where: { id: userId } });

    if (!owner) {
      throw new NotFoundException('User not found');
    }

    // Check if user has permission to create stores
    if (owner.role !== UserRole.ADMIN && owner.role !== UserRole.STORE_OWNER) {
      throw new ForbiddenException('Only admins and store owners can create stores');
    }

    try {
      // Check for existing store name
      const existingStore = await this.storesRepository.findOne({
        where: { name: createStoreDto.name }
      });

      if (existingStore) {
        throw new ConflictException('A store with this name already exists');
      }

      const store = this.storesRepository.create({
        ...createStoreDto,
        owner,
        status: StoreStatus.ACTIVE
      });

      const savedStore = await this.storesRepository.save(store);
      
      // Clear cache after successful operation
      await this.clearStoreListCache();
      
      // Return store with relations
      return await this.storesRepository.findOneOrFail({
        where: { id: savedStore.id },
        relations: ['owner']
      });
    } catch (error: unknown) {
      // If it's already one of our custom exceptions, re-throw it
      if (error instanceof ConflictException) {
        throw error;
      }
      
      if (error instanceof QueryFailedError) {
        // Handle database constraint violations
        if (error.message.includes('name') || error.code === '23505') {
          throw new ConflictException('A store with this name already exists');
        }
        if (error.message.includes('email')) {
          throw new ConflictException('A store with this email already exists');
        }
      }
      
      this.logger.error('Failed to create store', error);
      throw new BadRequestException('Failed to create store');
    }
  }

  async findAll(queryOptions: StoreQueryOptions = {}): Promise<StoreListResult> {
    const {
      search,
      status,
      ownerId,
      page = 1,
      limit = this.DEFAULT_PAGE_SIZE,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeInactive = false
    } = queryOptions;

    this.validatePaginationParams(page, limit);

    const cacheKey = this.getStoreListCacheKey(queryOptions);
    const cached = await this.getCached<StoreListResult>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const where: FindOptionsWhere<Store> = {};

      if (search) {
        where.name = Like(`%${search}%`);
      }

      if (status) {
        where.status = status;
      } else if (!includeInactive) {
        where.status = Not(StoreStatus.INACTIVE);
      }

      if (ownerId) {
        where.owner = { id: ownerId };
      }

      const [stores, total] = await this.storesRepository.findAndCount({
        where,
        relations: ['owner'],
        order: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      const result: StoreListResult = {
        data: stores,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      await this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch stores', error);
      throw new BadRequestException('Failed to fetch stores');
    }
  }

  async findOne(id: string, relations: string[] = ['owner']): Promise<Store> {
    const cacheKey = this.getStoreCacheKey(id);
    const cached = await this.getCached<Store>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const store = await this.storesRepository.findOne({
        where: { id },
        relations
      });

      if (!store) {
        throw new NotFoundException(`Store with ID ${id} not found`);
      }

      await this.setCached(cacheKey, store);
      return store;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch store ${id}`, error);
      throw new BadRequestException('Failed to fetch store');
    }
  }

  async update(id: string, updateStoreDto: UpdateStoreDto, userId: string): Promise<Store> {
    const store = await this.findOne(id);
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check permissions
    if (user.role !== UserRole.ADMIN && store.owner.id !== userId) {
      throw new ForbiddenException('You can only update your own stores');
    }

    try {
      // Check for name conflicts if name is being updated
      if (updateStoreDto.name && updateStoreDto.name !== store.name) {
        const existingStore = await this.storesRepository.findOne({
          where: { name: updateStoreDto.name, id: Not(id) }
        });

        if (existingStore) {
          throw new ConflictException('A store with this name already exists');
        }
      }

      Object.assign(store, updateStoreDto);
      const updatedStore = await this.storesRepository.save(store);

      // Clear caches
      await Promise.all([
        this.deleteCached(this.getStoreCacheKey(id)),
        this.clearStoreListCache()
      ]);

      return updatedStore;
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        throw error;
      }
      
      if (error instanceof QueryFailedError) {
        if (error.message.includes('name') || error.code === '23505') {
          throw new ConflictException('A store with this name already exists');
        }
      }
      
      this.logger.error(`Failed to update store ${id}`, error);
      throw new BadRequestException('Failed to update store');
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    const store = await this.findOne(id);
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check permissions
    if (user.role !== UserRole.ADMIN && store.owner.id !== userId) {
      throw new ForbiddenException('You can only delete your own stores');
    }

    try {
      await this.storesRepository.remove(store);

      // Clear caches
      await Promise.all([
        this.deleteCached(this.getStoreCacheKey(id)),
        this.deleteCached(this.getRatingCacheKey(id)),
        this.clearStoreListCache()
      ]);
    } catch (error) {
      this.logger.error(`Failed to delete store ${id}`, error);
      throw new BadRequestException('Failed to delete store');
    }
  }

  async findByOwner(ownerId: string, queryOptions: Omit<StoreQueryOptions, 'ownerId'> = {}): Promise<StoreListResult> {
    return this.findAll({ ...queryOptions, ownerId });
  }

  async updateStatus(id: string, status: StoreStatus, userId: string): Promise<Store> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update store status');
    }

    const store = await this.findOne(id);
    
    try {
      store.status = status;
      const updatedStore = await this.storesRepository.save(store);

      // Clear caches
      await Promise.all([
        this.deleteCached(this.getStoreCacheKey(id)),
        this.clearStoreListCache()
      ]);

      return updatedStore;
    } catch (error) {
      this.logger.error(`Failed to update store status ${id}`, error);
      throw new BadRequestException('Failed to update store status');
    }
  }

  async getStoreRating(storeId: string): Promise<StoreRating> {
    const cacheKey = this.getRatingCacheKey(storeId);
    const cached = await this.getCached<StoreRating>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // This would typically query a reviews/ratings table
      // For now, returning a placeholder implementation
      const rating: StoreRating = {
        average: 0,
        count: 0
      };

      await this.setCached(cacheKey, rating);
      return rating;
    } catch (error) {
      this.logger.error(`Failed to get rating for store ${storeId}`, error);
      return { average: 0, count: 0 };
    }
  }

  async searchStores(query: string, options: Omit<StoreQueryOptions, 'search'> = {}): Promise<StoreListResult> {
    return this.findAll({ ...options, search: query });
  }

  async getActiveStores(): Promise<Store[]> {
    try {
      const cacheKey = `${this.STORE_LIST_CACHE_PREFIX}active_only`;
      const cached = await this.getCached<Store[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const stores = await this.storesRepository.find({
        where: { status: StoreStatus.ACTIVE },
        relations: ['owner'],
        order: { createdAt: 'DESC' }
      });

      await this.setCached(cacheKey, stores);
      return stores;
    } catch (error) {
      this.logger.error('Failed to fetch active stores', error);
      throw new BadRequestException('Failed to fetch active stores');
    }
  }

  async validateStoreOwnership(storeId: string, userId: string): Promise<boolean> {
    try {
      const store = await this.findOne(storeId);
      return store.owner.id === userId;
    } catch (error) {
      return false;
    }
  }

  async getStoreStats(storeId: string): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
  }> {
    // Placeholder implementation - would typically aggregate from orders/reviews tables
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageRating: 0,
      totalReviews: 0
    };
  }
}