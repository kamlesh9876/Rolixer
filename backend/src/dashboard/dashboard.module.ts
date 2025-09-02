import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Rating } from '../ratings/entities/rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Store, Rating]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
