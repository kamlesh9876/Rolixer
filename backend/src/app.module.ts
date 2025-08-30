import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { RatingsModule } from './ratings/ratings.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 15 * 60 * 1000, // 15 minutes in milliseconds
        limit: 5, // 5 requests per 15 minutes for auth endpoints
      },
    ]),
    RedisModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // ... your existing TypeORM config
        cache: {
          type: 'redis',
          options: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
          },
          duration: 30000, // 30 seconds
          ignoreErrors: true,
        },
      }),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    StoresModule,
    RatingsModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'CACHE_MANAGER',
      useFactory: (cacheManager: any) => cacheManager,
      inject: ['CACHE_MANAGER'],
    },
  ],
})
export class AppModule {}
