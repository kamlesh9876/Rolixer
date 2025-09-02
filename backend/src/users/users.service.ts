import { 
  Injectable, 
  ConflictException, 
  NotFoundException, 
  UnauthorizedException, 
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';
import { Store, StoreStatus } from '../stores/entities/store.entity';

type UserQueryOptions = {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  excludeCurrentUser?: boolean;
  currentUserId?: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto, currentUserRole?: UserRole): Promise<User> {
    // Check if email already exists
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: createUserDto.email } 
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Only admins can create other admins or store owners
    if (
      (createUserDto.role === UserRole.ADMIN || createUserDto.role === UserRole.STORE_OWNER) &&
      currentUserRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only admins can create admin or store owner accounts');
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(query: UserQueryOptions = {}): Promise<{ data: User[]; total: number }> {
    const {
      search,
      role,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      excludeCurrentUser = false,
      currentUserId,
    } = query;

    const skip = (page - 1) * limit;
    const where: FindManyOptions<User>['where'] = {};

    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (role) {
      where.role = role;
    }

    if (excludeCurrentUser && currentUserId) {
      where.id = Not(currentUserId);
    }

    const [data, total] = await this.usersRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
      relations: ['ownedStores'],
      select: ['id', 'name', 'email', 'role', 'address', 'phone', 'createdAt', 'updatedAt'],
    });

    return { data, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id },
      relations: ['ownedStores', 'ratings', 'ratings.store'],
      select: ['id', 'name', 'email', 'role', 'address', 'phone', 'createdAt', 'updatedAt'],
    }) as User | null;

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'name', 'email', 'password', 'role', 'address', 'phone'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUserId?: string, currentUserRole?: UserRole): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if the current user is updating their own profile or is an admin
    if (currentUserId && currentUserId !== id && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // If not admin, ensure role is not being changed to admin
    if (currentUserRole && currentUserRole !== UserRole.ADMIN) {
      if (updateUserDto.role && updateUserDto.role === UserRole.ADMIN) {
        throw new ForbiddenException('You cannot assign admin role');
      }
      
      // Non-admin users cannot change roles
      if (updateUserDto.role && updateUserDto.role !== user.role) {
        throw new ForbiddenException('Only admins can change user roles');
      }
    }

    // Check if email is being updated and if it's already in use
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({ 
        where: { email: updateUserDto.email } 
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async changePassword(
    id: string, 
    changePasswordDto: ChangePasswordDto, 
    currentUser: any,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({ 
      where: { id },
      select: ['id', 'password', 'name', 'email'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if current user is admin or the same user
    if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== id) {
      throw new ForbiddenException('You can only change your own password');
    }

    // If not admin, verify current password
    if (currentUser.role !== UserRole.ADMIN) {
      const isPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    // Check if new password matches confirm password
    if (changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    // Hash and update password
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(changePasswordDto.newPassword, salt);
    
    await this.usersRepository.save(user);
  }

  async registerStoreOwner(
    createUserDto: CreateUserDto,
    storeData: { name: string; address: string; description?: string },
  ) {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Create user with STORE_OWNER role
    const user = this.usersRepository.create({
      ...createUserDto,
      role: UserRole.STORE_OWNER,
    });

    // Hash password
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(createUserDto.password, salt);

    // Save user
    const savedUser = await this.usersRepository.save(user);

    // Create store with proper typing and required fields
    const store = this.storeRepository.create({
      name: storeData.name,
      address: storeData.address,
      email: createUserDto.email, // Using the same email as the owner
      description: storeData.description || '',
      owner: savedUser,
      ownerId: savedUser.id,
      status: StoreStatus.PENDING,
      businessHours: {},
      averageRating: 0,
      totalRatings: 0,
      isFeatured: false,
      phone: '', // Required field, can be updated later
      website: '' // Optional field
    });

    await this.storeRepository.save(store);

    // Send verification email
    // TODO: Implement email verification

    return {
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
      store: {
        id: store.id,
        name: store.name,
        status: store.status,
      },
    };
  }

  async remove(id: string, currentUserId?: string, currentUserRole?: UserRole): Promise<void> {
    const user = await this.usersRepository.findOne({ 
      where: { id },
      relations: ['ownedStores'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if the current user is deleting their own account or is an admin
    if (currentUserId && currentUserId !== id && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own account');
    }

    // Prevent deleting admin accounts unless it's the admin themselves
    if (user.role === UserRole.ADMIN && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete admin accounts');
    }

    // Check if user owns any stores
    if (user.ownedStores && user.ownedStores.length > 0) {
      throw new BadRequestException('Cannot delete user with associated stores');
    }

    await this.usersRepository.remove(user);
  }

  async getStoreOwners(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.STORE_OWNER },
      select: ['id', 'name', 'email'],
    });
  }

  async getUserStats() {
    const [totalUsers, totalAdmins, totalStoreOwners, totalRegularUsers] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { role: UserRole.ADMIN } }),
      this.usersRepository.count({ where: { role: UserRole.STORE_OWNER } }),
      this.usersRepository.count({ where: { role: UserRole.CUSTOMER } }),
    ]);

    return {
      totalUsers,
      totalAdmins,
      totalStoreOwners,
      totalRegularUsers,
    };
  }
}
