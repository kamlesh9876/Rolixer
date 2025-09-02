import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application status' })
  @ApiResponse({ status: 200, description: 'Application is running' })
  getHello(): { status: string; timestamp: string } {
    this.logger.log('Health check endpoint called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    this.logger.log('Health check endpoint called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Store Rating System API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
