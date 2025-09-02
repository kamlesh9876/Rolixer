import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { RatingsModule } from './ratings/ratings.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
      ttl: 300, // 5 minutes
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    StoresModule,
    RatingsModule,
    DashboardModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
