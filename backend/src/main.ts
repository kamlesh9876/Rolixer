import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Enable CORS with more restrictive configuration
  const allowedOrigins = configService.get('FRONTEND_URL', 'http://localhost:3000').split(',');
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400, // 24 hours
  });

  // Add basic security headers
  app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Remove server header
    res.removeHeader('X-Powered-By');
    
    next();
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

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap().catch(err => {
  console.error('Error during application startup', err);
  process.exit(1);
});
