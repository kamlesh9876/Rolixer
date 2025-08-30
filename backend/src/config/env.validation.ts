import { plainToClass, Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsOptional, MinLength, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3000;

  // Database Configuration
  @IsString()
  DB_HOST: string = 'localhost';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DB_PORT: number = 5432;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  // Redis Configuration
  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_PORT: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  // JWT Configuration
  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters long for security' })
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string = '24h';

  // CORS Configuration
  @IsString()
  FRONTEND_URL: string = 'http://localhost:3000';

  // Rate Limiting
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  THROTTLE_TTL?: number = 60;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  THROTTLE_LIMIT?: number = 10;

  // Security
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  BCRYPT_ROUNDS?: number = 12;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map(error => {
      return `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`;
    });
    
    throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
  }

  // Additional security checks for production
  if (validatedConfig.NODE_ENV === Environment.Production) {
    if (validatedConfig.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
      throw new Error('JWT_SECRET must be changed from default value in production');
    }
    
    if (validatedConfig.DB_PASSWORD === 'postgres') {
      console.warn('⚠️  WARNING: Using default database password in production is not recommended');
    }
  }

  return validatedConfig;
}