import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TwoFactorAuthController } from './two-factor-auth.controller';
import { JwtStrategy, JwtTwoFactorStrategy, JwtRefreshStrategy } from './strategies';
import { UsersModule } from '../users/users.module';
import { StoresModule } from '../stores/stores.module';
import { MailModule } from '../mail/mail.module';
import { VerificationModule } from './verification.module';
import { VerificationService } from './verification.service';
import { TwoFactorAuthModule } from './two-factor-auth.module';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Store, VerificationToken]),
    UsersModule,
    StoresModule,
    MailModule,
    VerificationModule,
    TwoFactorAuthModule,
    PassportModule.register({ defaultStrategy: ['jwt', 'jwt-two-factor'] }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRATION_TIME', '3600s');
        
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in configuration');
        }
        
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
    ConfigModule,
  ],
  controllers: [
    AuthController, 
    TwoFactorAuthController,
  ],
  providers: [
    AuthService,
    VerificationService,
    TwoFactorAuthService,
    JwtStrategy,
    JwtTwoFactorStrategy,
    JwtRefreshStrategy,
    {
      provide: 'JWT_REFRESH_SECRET',
      useFactory: (configService: ConfigService) => {
        const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
        if (!refreshSecret) {
          throw new Error('JWT_REFRESH_SECRET is not defined in configuration');
        }
        return refreshSecret;
      },
      inject: [ConfigService],
    },
    {
      provide: 'JWT_VERIFICATION_TOKEN_SECRET',
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_VERIFICATION_TOKEN_SECRET');
        if (!secret) {
          throw new Error('JWT_VERIFICATION_TOKEN_SECRET is not defined in configuration');
        }
        return secret;
      },
      inject: [ConfigService],
    },
    {
      provide: 'JWT_VERIFICATION_TOKEN_EXPIRATION_TIME',
      useValue: '86400', // 24 hours
    },
    {
      provide: 'JWT_ACCESS_TOKEN_SERVICE',
      useExisting: JwtService,
    },
    {
      provide: 'JWT_REFRESH_TOKEN_SERVICE',
      useFactory: (configService: ConfigService) => {
        const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
        if (!refreshSecret) {
          throw new Error('JWT_REFRESH_SECRET is not defined in configuration');
        }
        return new JwtService({
          secret: refreshSecret,
          signOptions: { expiresIn: '7d' },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    JwtStrategy,
    JwtTwoFactorStrategy,
    JwtRefreshStrategy,
    VerificationService,
    TwoFactorAuthService,
    'JWT_ACCESS_TOKEN_SERVICE',
    'JWT_REFRESH_TOKEN_SERVICE',
  ],
})
export class AuthModule {}
