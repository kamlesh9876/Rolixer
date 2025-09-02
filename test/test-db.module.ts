import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDbConfig } from './test-db.config';

@Module({
  imports: [TypeOrmModule.forRoot(testDbConfig)],
  exports: [TypeOrmModule],
})
export class TestDbModule {}
