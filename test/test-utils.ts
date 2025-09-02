import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export const createTestApp = async (module: any): Promise<{
  app: INestApplication;
  request: request.SuperTest<request.Test>;
}> => {
  const moduleFixture = await Test.createTestingModule({
    imports: [module],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return {
    app,
    request: request(app.getHttpServer()),
  };
};

export const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const loginTestUser = async (app: INestApplication) => {
  const { body } = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD,
    });
  
  return body.accessToken;
};

export const loginAdmin = async (app: INestApplication) => {
  const { body } = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email: process.env.TEST_ADMIN_EMAIL,
      password: process.env.TEST_ADMIN_PASSWORD,
    });
  
  return body.accessToken;
};
