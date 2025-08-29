import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { Store } from './entities/store.entity';
import { User } from '../users/entities/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UserRole } from '../users/entities/user.entity';

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
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

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

    return { data, total };
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storesRepository.findOne({
      where: { id },
      relations: ['owner', 'ratings', 'ratings.user'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto, userId: string): Promise<Store> {
    const store = await this.findOne(id);
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
