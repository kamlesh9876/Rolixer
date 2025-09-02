import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, HttpException, HttpStatus, LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

class FileLogger implements LoggerService {
  private logFile: string;
  private logger: Logger;

  constructor() {
    this.logFile = path.join(process.cwd(), 'backend.log');
    this.logger = new Logger('Bootstrap');
  }

  log(message: string) {
    this.logger.log(message);
    this.writeToFile(`[LOG] ${message}`);
  }

  error(message: string, trace: string) {
    this.logger.error(message, trace);
    this.writeToFile(`[ERROR] ${message}\n${trace}`);
  }

  warn(message: string) {
    this.logger.warn(message);
    this.writeToFile(`[WARN] ${message}`);
  }

  private writeToFile(message: string) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(this.logFile, `[${timestamp}] ${message}\n`);
  }
}

async function bootstrap() {
  const logger = new FileLogger();
  
  try {
    logger.log('Starting application...');
    const app = await NestFactory.create(AppModule, {
      logger,
    });
    const configService = app.get(ConfigService);

  // Enable CORS for development
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global error handling
  app.useGlobalFilters(new HttpExceptionFilter());

    const port = configService.get('PORT', 3001);
    await app.listen(port);
    
    logger.log(`Application is running on: http://localhost:${port}/api/v1`);
  } catch (error) {
    logger.error('Failed to start application', error.stack || error.message);
    process.exit(1);
  }
  logger.log(`Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap().catch(err => {
  console.error('Error during application startup', err);
  process.exit(1);
});
