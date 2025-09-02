import { Test } from '@nestjs/testing';
import { TestDbModule } from './test-db.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

declare global {
  // eslint-disable-next-line no-var
  var app: INestApplication;
  // eslint-disable-next-line no-var
  var request: request.SuperTest<request.Test>;
}

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [TestDbModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  
  // Store in global for test access
  global.app = app;
  global.request = request(app.getHttpServer());
});

afterAll(async () => {
  if (global.app) {
    await global.app.close();
  }
});
