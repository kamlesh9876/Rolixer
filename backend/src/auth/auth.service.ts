import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException, 
  Inject, 
  forwardRef,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Store, StoreStatus } from '../stores/entities/store.entity';
import { CreateUserDto, SecurityQuestionDto, UserType } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { VerificationService } from './verification.service';
import { TwoFactorAuthService } from './two-factor-auth.service';

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
    private configService: ConfigService,
    private mailService: MailService,
    private verificationService: VerificationService,
    private twoFactorAuthService: TwoFactorAuthService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      return null;
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // If 2FA is enabled, we'll return the user with a flag indicating 2FA is required
    if (user.isTwoFactorEnabled) {
      const { password, ...result } = user;
      return { ...result, requires2FA: true };
    }

    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If 2FA is enabled, return a temporary token for 2FA verification
    if (user.requires2FA) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, is2FAPending: true },
        { expiresIn: '5m' }
      );
      
      return {
        requires2FA: true,
        tempToken
      };
    }

    // Generate tokens
    return this.generateAndSaveTokens(user);
  }

  async verify2FACode(twoFactorAuthCodeDto: any) {
    const { code, tempToken } = twoFactorAuthCodeDto;
    
    try {
      // Verify the temp token
      const payload = this.jwtService.verify(tempToken);
      if (!payload || !payload.is2FAPending || !payload.sub) {
        throw new UnauthorizedException('Invalid or expired verification token');
      }

      // Get the user
      const user = await this.usersRepository.findOne({ 
        where: { id: payload.sub },
        relations: ['store']
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify the 2FA code
      const isCodeValid = await this.twoFactorAuthService.verifyTwoFactorCode(
        user,
        code
      );

      if (!isCodeValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }

      // Generate tokens with 2FA verified
      return this.generateAndSaveTokens(user, true);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Verification token has expired');
      }
      throw error;
    }
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'email', 'role', 'isEmailVerified', 'isTwoFactorEnabled', 'refreshToken']
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify refresh token
    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    return this.generateAndSaveTokens(user);
  }

  async logout(userId: string) {
    await this.usersRepository.update(userId, { refreshToken: null });
  }

  private async generateAndSaveTokens(user: any, is2FAAuthenticated = false) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isSecondFactorAuthenticated: is2FAAuthenticated
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(
        { sub: user.id },
        { 
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: '7d' 
        }
      )
    ]);

    // Save hashed refresh token to user
    await this.usersRepository.update(user.id, { 
      refreshToken: await bcrypt.hash(refreshToken, 10),
      lastLogin: new Date() 
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        store: user.store ? { id: user.store.id, name: user.store.name } : null
      }
    };
  }

  async validateUserById(userId: string): Promise<User> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      relations: ['store']
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async getUserIfRefreshTokenMatches(userId: string, refreshToken: string): Promise<User> {
    if (!userId || !refreshToken) {
      throw new UnauthorizedException('User ID and refresh token are required');
    }

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.refreshToken', 'user.isActive', 'user.isEmailVerified'])
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenMatching) {
      // Invalidate the stored refresh token if it doesn't match
      user.refreshToken = null;
      await this.usersRepository.save(user);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return user;
  }

  async register(createUserDto: CreateUserDto) {
    const queryRunner = this.usersRepository.manager.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Check if email already exists
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // Hash password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      // Create user (initially inactive until email is verified)
      const user = queryRunner.manager.create(User, {
        ...createUserDto,
        password: hashedPassword,
        isActive: true, // User can login but with limited access until email is verified
        isEmailVerified: false,
      });

      const savedUser = await queryRunner.manager.save(user);
      
      // Generate and save verification token
      const verificationToken = await this.verificationService.createVerificationToken(
        savedUser,
        'email_verification'
      );
      
      // Send verification email
      await this.mailService.sendVerificationEmail(
        savedUser.email,
        savedUser.name,
        verificationToken
      );
      
      await queryRunner.commitTransaction();

      // Generate JWT token (with limited permissions until email is verified)
      const payload = { 
        sub: savedUser.id, 
        email: savedUser.email, 
        role: savedUser.role,
        isEmailVerified: false
      };
      
      return {
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          isActive: savedUser.isActive,
          isEmailVerified: false,
        },
        access_token: this.jwtService.sign(payload),
        message: 'Registration successful. Please check your email to verify your account.'
      };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to register user: ' + error.message);
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async registerStoreOwner(registerStoreOwnerDto: any) {
    const queryRunner = this.usersRepository.manager.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Check if email already exists
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: registerStoreOwnerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // Hash password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(registerStoreOwnerDto.password, salt);

      // Create user
      const user = queryRunner.manager.create(User, {
        name: registerStoreOwnerDto.name,
        email: registerStoreOwnerDto.email,
        password: hashedPassword,
        phone: registerStoreOwnerDto.phone,
        address: registerStoreOwnerDto.address,
        role: UserRole.STORE_OWNER,
        isActive: true,
        isEmailVerified: false,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Create store
      const store = queryRunner.manager.create(Store, {
        ...registerStoreOwnerDto.store,
        owner: savedUser,
        status: StoreStatus.PENDING,
      });

      const savedStore = await queryRunner.manager.save(store);

      // Update user with store reference
      savedUser.store = savedStore;
      await queryRunner.manager.save(User, savedUser);

      // Generate and save verification token
      const verificationToken = await this.verificationService.createVerificationToken(
        savedUser,
        'email_verification'
      );
      
      // Send verification email
      await this.mailService.sendVerificationEmail(
        savedUser.email,
        savedUser.name,
        verificationToken
      );

      await queryRunner.commitTransaction();

      // Generate JWT token
      const payload = { 
        sub: savedUser.id, 
        email: savedUser.email, 
        role: savedUser.role 
      };
      
      return {
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          isActive: savedUser.isActive,
        },
        store: {
          id: savedStore.id,
          name: savedStore.name,
          status: savedStore.status,
        },
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to register store owner');
    } finally {
      await queryRunner.release();
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      relations: ['store']
    });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    // Remove sensitive data
    const { password, twoFactorSecret, resetPasswordToken, resetPasswordExpires, ...result } = user;
    return result;
  }
  
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.verificationService.verifyEmail(token);
      return result;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to verify email');
    }
  }
  
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal that the email doesn't exist for security reasons
      return {
        success: true,
        message: 'If your email is registered, you will receive a verification link.'
      };
    }
    
    if (user.isEmailVerified) {
      return {
        success: true,
        message: 'Email is already verified.'
      };
    }
    
    // Generate and save new verification token
    const verificationToken = await this.verificationService.createVerificationToken(
      user,
      'email_verification'
    );
    
    // Send verification email
    await this.mailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );
    
    return {
      success: true,
      message: 'Verification email has been resent. Please check your inbox.'
    };
  }
}
