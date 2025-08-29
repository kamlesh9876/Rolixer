import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

type RatingQueryOptions = {
  storeId?: string;
  userId?: string;
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
};

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  async create(createRatingDto: CreateRatingDto, userId: string): Promise<Rating> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const store = await this.storesRepository.findOne({ 
      where: { id: createRatingDto.storeId },
      relations: ['owner'],
    });
    
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if user has already rated this store
    const existingRating = await this.ratingsRepository.findOne({
      where: {
        user: { id: userId },
        store: { id: createRatingDto.storeId },
      },
    });

    if (existingRating) {
      throw new ConflictException('You have already rated this store');
    }

    const rating = this.ratingsRepository.create({
      ...createRatingDto,
      user,
      store,
    });

    const savedRating = await this.ratingsRepository.save(rating);
    
    // Update store's average rating
    await this.updateStoreRating(store.id);
    
    return savedRating;
  }

  async findAll(query: RatingQueryOptions = {}): Promise<{ data: Rating[]; total: number }> {
    const {
      storeId,
      userId,
      minRating,
      maxRating,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (storeId) {
      where.store = { id: storeId };
    }

    if (userId) {
      where.user = { id: userId };
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) {
        where.rating = MoreThanOrEqual(minRating);
      }
      if (maxRating !== undefined) {
        where.rating = { ...where.rating, ...LessThanOrEqual(maxRating) };
      }
    }

    if (startDate || endDate) {
      where.createdAt = Between(
        startDate || new Date(0), // If no start date, use the beginning of time
        endDate || new Date(),     // If no end date, use now
      );
    }

    const [data, total] = await this.ratingsRepository.findAndCount({
      where,
      relations: ['user', 'store'],
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Rating> {
    const rating = await this.ratingsRepository.findOne({
      where: { id },
      relations: ['user', 'store'],
    });

    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    return rating;
  }

  async update(
    id: string, 
    updateRatingDto: UpdateRatingDto, 
    userId: string,
    isAdmin: boolean = false,
  ): Promise<Rating> {
    const rating = await this.ratingsRepository.findOne({
      where: { id },
      relations: ['user', 'store'],
    });

    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    // Check if the user is the owner of the rating or an admin
    if (rating.user.id !== userId && !isAdmin) {
      throw new ForbiddenException('You can only update your own ratings');
    }

    // If updating the store, verify it exists
    if (updateRatingDto.storeId) {
      const store = await this.storesRepository.findOne({
        where: { id: updateRatingDto.storeId },
      });
      
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      
      rating.store = store;
    }

    Object.assign(rating, updateRatingDto);
    const updatedRating = await this.ratingsRepository.save(rating);
    
    // Update store's average rating
    if (updateRatingDto.rating !== undefined) {
      await this.updateStoreRating(rating.store.id);
    }
    
    return updatedRating;
  }

  async remove(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const rating = await this.ratingsRepository.findOne({
      where: { id },
      relations: ['user', 'store'],
    });

    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    // Check if the user is the owner of the rating, the store owner, or an admin
    if (rating.user.id !== userId && 
        rating.store.owner.id !== userId && 
        !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this rating');
    }

    const storeId = rating.store.id;
    await this.ratingsRepository.remove(rating);
    
    // Update store's average rating
    await this.updateStoreRating(storeId);
  }

  async getUserRatingForStore(userId: string, storeId: string): Promise<Rating | null> {
    return this.ratingsRepository.findOne({
      where: {
        user: { id: userId },
        store: { id: storeId },
      },
      relations: ['store'],
    });
  }

  private async updateStoreRating(storeId: string): Promise<void> {
    const store = await this.storesRepository.findOne({
      where: { id: storeId },
      relations: ['ratings'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    store.updateAverageRating();
    await this.storesRepository.save(store);
  }
}
