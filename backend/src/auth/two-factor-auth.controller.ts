import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Req, 
  BadRequestException,
  UnauthorizedException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { User } from '../users/entities/user.entity';

@ApiTags('2FA')
@Controller('2fa')
export class TwoFactorAuthController {
  constructor(private readonly twoFactorAuthService: TwoFactorAuthService) {}

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  @ApiResponse({ status: 200, description: '2FA secret and QR code generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generate(@Req() req: any) {
    const user = req.user as User;
    return this.twoFactorAuthService.generateTwoFactorAuthSecret(user);
  }

  @Post('enable')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA for a user' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '2FA verification code from authenticator app' },
      },
      required: ['code'],
    },
  })
  async enableTwoFactorAuth(@Req() req: any, @Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('Verification code is required');
    }
    
    const user = req.user as User;
    return this.twoFactorAuthService.enableTwoFactorAuth(user.id, code);
  }

  @Post('disable')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA for a user' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async disableTwoFactorAuth(@Req() req: any) {
    const user = req.user as User;
    return this.twoFactorAuthService.disableTwoFactorAuth(user.id);
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify 2FA code' })
  @ApiResponse({ status: 200, description: '2FA code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '2FA verification code' },
      },
      required: ['code'],
    },
  })
  async verifyTwoFactorCode(
    @Req() req: any,
    @Body('code') code: string
  ) {
    if (!code) {
      throw new BadRequestException('Verification code is required');
    }

    const user = req.user as User;
    const dbUser = await this.twoFactorAuthService['usersRepository'].findOne({
      where: { id: user.id },
      select: ['id', 'twoFactorSecret', 'isTwoFactorEnabled']
    });

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    if (!dbUser.isTwoFactorEnabled || !dbUser.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    const isCodeValid = await this.twoFactorAuthService.verifyTwoFactorCode(
      dbUser,
      code
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    return { 
      success: true, 
      message: '2FA code verified successfully' 
    };
  }
}
