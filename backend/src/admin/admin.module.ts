import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Store, Rating]),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AdminService],
})
export class AdminModule {}
