import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
  ],
  providers: [TwoFactorAuthService],
  exports: [TwoFactorAuthService],
})
export class TwoFactorAuthModule {}
