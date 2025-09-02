import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request.agent(httpServer)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('info');
    });
  });

  describe('API Documentation', () => {
    it('should return Swagger JSON', async () => {
      const response = await request.agent(httpServer)
        .get('/api-json')
        .expect(200);
      
      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
    });
  });
});
