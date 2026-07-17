import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { FindProductsQueryDto } from './dto/find-products-query.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products',
    description: 'Public. Supports search, filtering, pagination, and sorting.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Case insensitive search on product name' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category id' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price (inclusive)' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price (inclusive)' })
  @ApiQuery({ name: 'inStock', required: false, description: 'Only in-stock products' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number, starting at 1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'price', 'createdAt'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Paginated product list returned' })
  async findAll(@Query() query: FindProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id', description: 'Product id' })
  @ApiResponse({ status: 200, description: 'Product returned' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a product', description: 'ADMIN only.' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a product', description: 'ADMIN only. Partial update, only sent fields change.' })
  @ApiParam({ name: 'id', description: 'Product id' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Product or category not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Delete a product',
    description: 'ADMIN only. Blocked if the product appears in existing orders.',
  })
  @ApiParam({ name: 'id', description: 'Product id' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product appears in existing orders' })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
