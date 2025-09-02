import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Req, 
  BadRequestException, 
  Query, 
  HttpCode, 
  HttpStatus,
  Headers
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard, JwtRefreshGuard } from './guards';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiBody, 
  ApiHeader 
} from '@nestjs/swagger';
import { RegisterStoreOwnerDto } from './dto/register-store-owner.dto';
import { Public } from './decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { TwoFactorAuthCodeDto } from './dto/two-factor-auth-code.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() createUserDto: CreateUserDto) {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful or 2FA required',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        {
          type: 'object',
          properties: {
            requires2FA: { type: 'boolean' },
            tempToken: { type: 'string' }
          }
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code' })
  @ApiResponse({ 
    status: 200, 
    description: '2FA verification successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
        user: { $ref: '#/components/schemas/User' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code' })
  async verify2FACode(@Body() twoFactorAuthCodeDto: TwoFactorAuthCodeDto) {
    return this.authService.verify2FACode(twoFactorAuthCodeDto);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Refresh token in format: Bearer <token>',
    required: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refresh successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Req() req) {
    const userId = req.user.sub;
    const refreshToken = req.headers['authorization']?.split(' ')[1];
    
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('register/store-owner')
  @ApiOperation({ summary: 'Register a new store owner' })
  @ApiResponse({ status: 201, description: 'Store owner successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async registerStoreOwner(@Body() registerStoreOwnerDto: RegisterStoreOwnerDto) {
    if (registerStoreOwnerDto.password !== registerStoreOwnerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    return this.authService.registerStoreOwner(registerStoreOwnerDto);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email resent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
      },
      required: ['email'],
    },
  })
  async resendVerificationEmail(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.resendVerificationEmail(email);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    type: User
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req) {
    await this.authService.logout(req.user.sub);
    return { message: 'Successfully logged out' };
  }
}
