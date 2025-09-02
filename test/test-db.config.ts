import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.TEST_DATABASE_URL,
  entities: [join(__dirname, '../src/**/*.entity{.ts,.js}')],
  synchronize: true,
  dropSchema: true, // Clear test database between test runs
  logging: process.env.LOG_LEVEL === 'debug',
};
