import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Rating } from '../ratings/entities/rating.entity';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: path.join(process.cwd(), 'database.sqlite'),
        entities: [User, Store, Rating],
        synchronize: true, // Auto-create tables in development
        logging: configService.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
      }),
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Database configuration options are required');
        }
        const dataSource = new DataSource(options);
        await dataSource.initialize();
        return dataSource;
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}