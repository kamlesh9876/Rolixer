import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved dashboard statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('store-owner/:storeId')
  @Roles(UserRole.STORE_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get store owner dashboard' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved store owner dashboard' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStoreOwnerDashboard(@Param('storeId') storeId: string) {
    return this.dashboardService.getStoreOwnerDashboard(storeId);
  }
}
