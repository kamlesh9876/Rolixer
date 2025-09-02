import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { AdminDashboardStats, UserListResponse, StoreListResponse } from './dto/admin-dashboard.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard statistics' })
  async getDashboardStats(): Promise<AdminDashboardStats> {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get paginated list of users' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of users' })
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('role') role?: UserRole,
  ): Promise<UserListResponse> {
    return this.adminService.getUsers(
      parseInt(page as any, 10),
      parseInt(limit as any, 10) > 100 ? 100 : parseInt(limit as any, 10),
      search,
      role
    );
  }

  @Get('stores')
  @ApiOperation({ summary: 'Get paginated list of stores' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of stores' })
  async getStores(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
  ): Promise<StoreListResponse> {
    return this.adminService.getStores(
      parseInt(page as any, 10),
      parseInt(limit as any, 10) > 100 ? 100 : parseInt(limit as any, 10),
      search
    );
  }

  @Get('stores/:id/ratings')
  @ApiOperation({ summary: 'Get ratings for a specific store' })
  @ApiResponse({ status: 200, description: 'Returns ratings for the specified store' })
  async getStoreRatings(@Param('id') storeId: string) {
    return this.adminService.getStoreRatings(storeId);
  }
}
