import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a store' })
  @ApiResponse({ status: 201, description: 'Rating successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @ApiResponse({ status: 409, description: 'You have already rated this store' })
  create(@Body() createRatingDto: CreateRatingDto, @Req() req) {
    return this.ratingsService.create(createRatingDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_OWNER, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all ratings' })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Returns all ratings' })
  async findAll(
    @Query('storeId') storeId?: string,
    @Query('userId') userId?: string,
    @Query('minRating') minRatingStr?: string,
    @Query('maxRating') maxRatingStr?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    // Parse ratings
    const minRating = minRatingStr ? parseInt(minRatingStr, 10) : 1;
    const maxRating = maxRatingStr ? parseInt(maxRatingStr, 10) : 5;

    if (isNaN(minRating) || isNaN(maxRating) || minRating < 1 || minRating > 5 || maxRating < 1 || maxRating > 5) {
      throw new BadRequestException('Rating must be a number between 1 and 5');
    }

    if (minRating > maxRating) {
      throw new BadRequestException('minRating cannot be greater than maxRating');
    }

    // Parse dates if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date');
      }
    }
    
    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date');
      }
    }

    // Parse pagination
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    
    if (isNaN(page) || page < 1) {
      throw new BadRequestException('Page must be a positive number');
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    return this.ratingsService.findAll({
      storeId,
      userId,
      minRating,
      maxRating,
      startDate,
      endDate,
      page,
      limit,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'DESC',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a rating by ID' })
  @ApiResponse({ status: 200, description: 'Rating found' })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  findOne(@Param('id') id: string) {
    return this.ratingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a rating' })
  @ApiResponse({ status: 200, description: 'Rating updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  update(
    @Param('id') id: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @Req() req,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.ratingsService.update(id, updateRatingDto, req.user.userId, isAdmin);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.STORE_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a rating' })
  @ApiResponse({ status: 200, description: 'Rating deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  remove(@Param('id') id: string, @Req() req) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isStoreOwner = req.user.role === UserRole.STORE_OWNER;
    return this.ratingsService.remove(id, req.user.userId, isAdmin || isStoreOwner);
  }

  @Get('user/:userId/store/:storeId')
  @ApiOperation({ summary: 'Get a user\'s rating for a specific store' })
  @ApiResponse({ status: 200, description: 'Rating found' })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  getUserRatingForStore(
    @Param('userId') userId: string,
    @Param('storeId') storeId: string,
  ) {
    return this.ratingsService.getUserRatingForStore(userId, storeId);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get all ratings for a specific store' })
  @ApiResponse({ status: 200, description: 'List of ratings' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  getStoreRatings(
    @Param('storeId') storeId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.ratingsService.findAll({
      storeId,
      page,
      limit,
    });
  }
}
