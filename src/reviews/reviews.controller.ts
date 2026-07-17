import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import type { AuthUser } from '../auth/types.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  @ApiOperation({
    summary: 'List reviews for a product',
    description: 'Public. Includes an averageRating/totalReviews summary. Newest first.',
  })
  @ApiParam({ name: 'productId', description: 'Product id' })
  @ApiResponse({ status: 200, description: 'Reviews and summary returned' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findAllForProduct(@Param('productId') productId: string) {
    return this.reviewsService.findAllForProduct(productId);
  }

  @Post('products/:productId/reviews')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Review a product', description: 'One review per user per product.' })
  @ApiParam({ name: 'productId', description: 'Product id' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'You have already reviewed this product' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, productId, dto);
  }

  @Patch('reviews/:id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update your own review' })
  @ApiParam({ name: 'id', description: 'Review id' })
  @ApiResponse({ status: 200, description: 'Review updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(user.id, id, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a review', description: 'Owner, or any ADMIN.' })
  @ApiParam({ name: 'id', description: 'Review id' })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Not your review, and not an admin' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviewsService.remove(user.id, user.role, id);
  }
}
