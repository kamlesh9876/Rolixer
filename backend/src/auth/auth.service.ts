import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Store, StoreStatus } from '../stores/entities/store.entity';
import { CreateUserDto, SecurityQuestionDto, UserType } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.id) {
      throw new InternalServerErrorException('User ID is missing');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const { 
      email, 
      password, 
      confirmPassword, 
      userType, 
      storeName, 
      address, 
      securityQuestions, 
      phoneFor2FA, 
      enable2FA, 
      ...userData 
    } = createUserDto;
    
    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    
    // Check if email already exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // For store owners, ensure store name is provided
    if (userType === UserType.STORE_OWNER && !storeName) {
      throw new BadRequestException('Store name is required for store owners');
    }

    // Convert UserType to UserRole
    const userRole = userType === UserType.STORE_OWNER ? UserRole.STORE_OWNER : 
                    userType === UserType.ADMIN ? UserRole.ADMIN : UserRole.CUSTOMER;

    // Start a transaction
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Hash the password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = new User();
      Object.assign(user, {
        ...userData,
        email,
        password: hashedPassword,
        role: userRole,
        phone: createUserDto.phone || null,
        securityQuestions: securityQuestions || [],
        enable2FA: enable2FA || false,
        phoneFor2FA: enable2FA ? phoneFor2FA : null,
      });

      const savedUser = await queryRunner.manager.save(User, user);

      // If user is a store owner, create a store
      if (userType === UserType.STORE_OWNER && storeName) {
        const store = new Store();
        Object.assign(store, {
          name: storeName,
          address: address || '',
          owner: savedUser,
          email: savedUser.email,
          status: StoreStatus.ACTIVE,
        });
        await queryRunner.manager.save(Store, store);
      }
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      // Generate JWT token for auto-login after registration
      const payload = {
        sub: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      };

      const token = this.jwtService.sign(payload);
      
      // Return user data without password and with token
      const { password: _, ...result } = savedUser;
      return {
        ...result,
        access_token: token,
      };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to register user: ' + error.message);
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return user;
  }
}
