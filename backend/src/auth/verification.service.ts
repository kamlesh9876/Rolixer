import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationToken } from './entities/verification-token.entity';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationToken)
    private readonly verificationTokenRepository: Repository<VerificationToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createVerificationToken(user: User, type: 'email_verification' | 'password_reset'): Promise<string> {
    // Delete any existing tokens of the same type for this user
    await this.verificationTokenRepository.delete({
      user: { id: user.id },
      type,
    });

    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 24 hours for email verification, 1 hour for password reset
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (type === 'email_verification' ? 24 : 1));

    // Create and save the token
    const verificationToken = this.verificationTokenRepository.create({
      token,
      expiresAt,
      type,
      user,
    });

    await this.verificationTokenRepository.save(verificationToken);
    return token;
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: { token, type: 'email_verification', isUsed: false },
      relations: ['user'],
    });

    if (!verificationToken) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    // Check if token is expired
    if (new Date() > verificationToken.expiresAt) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mark token as used
    verificationToken.isUsed = true;
    await this.verificationTokenRepository.save(verificationToken);

    // Update user's email verification status
    const user = verificationToken.user;
    user.isEmailVerified = true;
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async validatePasswordResetToken(token: string): Promise<User> {
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: { 
        token, 
        type: 'password_reset', 
        isUsed: false,
        expiresAt: new Date(),
      },
      relations: ['user'],
    });

    if (!verificationToken) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    return verificationToken.user;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await this.verificationTokenRepository.update(
      { token },
      { isUsed: true }
    );
  }
}
