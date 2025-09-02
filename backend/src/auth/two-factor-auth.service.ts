import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    @InjectRepository(User)
    public usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async generateTwoFactorAuthSecret(user: User) {
    const secret = speakeasy.generateSecret({
      name: `${this.configService.get('APP_NAME')}:${user.email}`,
      length: 20,
    });

    // Save the secret to the user
    await this.usersRepository.update(user.id, {
      twoFactorSecret: secret.base32,
      isTwoFactorEnabled: false, // Not enabled until verified
    });

    // Generate QR code URL
    const otpAuthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.email,
      issuer: this.configService.get('APP_NAME'),
      encoding: 'base32',
    });

    // Generate QR code as data URL
    const qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);

    return {
      secret: secret.base32,
      qrCodeUrl,
      otpAuthUrl,
    };
  }

  async verifyTwoFactorCode(user: User, code: string): Promise<boolean> {
    if (!user.twoFactorSecret) {
      throw new Error('2FA is not set up for this user');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1, // Allow 1 step (30 seconds) before/after current time
    });

    return verified;
  }

  async enableTwoFactorAuth(userId: string, code: string): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    const isCodeValid = await this.verifyTwoFactorCode(user, code);
    
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.usersRepository.update(userId, {
      isTwoFactorEnabled: true,
    });

    return {
      success: true,
      message: 'Two-factor authentication has been enabled successfully',
    };
  }

  async disableTwoFactorAuth(userId: string): Promise<{ success: boolean; message: string }> {
    await this.usersRepository.update(userId, {
      twoFactorSecret: null as any, // Using type assertion to handle the type mismatch
      isTwoFactorEnabled: false,
    });

    return {
      success: true,
      message: 'Two-factor authentication has been disabled successfully',
    };
  }

  async verifyTwoFactorAuthentication(user: User, code: string): Promise<boolean> {
    if (!user.twoFactorSecret || !user.isTwoFactorEnabled) {
      return false;
    }

    return this.verifyTwoFactorCode(user, code);
  }
}
