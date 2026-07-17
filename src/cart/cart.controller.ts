import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import type { AuthUser } from '../auth/types.js';
import { CartService } from './cart.service.js';
import { AddToCartDto } from './dto/add-to-cart.dto.js';
import { UpdateQuantityDto } from './dto/update-quantity.dto.js';

// Every route in this controller requires a session (no public cart route
// exists), so the guard and the security scheme are declared once, at the
// class level, rather than repeated on each method.
@ApiTags('Cart')
@ApiCookieAuth()
@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's cart", description: 'Auto-creates an empty cart on first access.' })
  @ApiResponse({ status: 200, description: 'Cart returned' })
  @ApiResponse({ status: 401, description: 'No active session' })
  async getCart(@CurrentUser() user: AuthUser) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a product to the cart', description: 'Increments quantity if already present.' })
  @ApiResponse({ status: 201, description: 'Item added' })
  @ApiResponse({ status: 400, description: 'Requested quantity exceeds available stock' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addItem(@CurrentUser() user: AuthUser, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Set an item quantity', description: 'Sets the exact quantity (does not add to it).' })
  @ApiParam({ name: 'productId', description: 'Product id' })
  @ApiResponse({ status: 200, description: 'Quantity updated' })
  @ApiResponse({ status: 400, description: 'Requested quantity exceeds available stock' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'Product not found, or not in your cart' })
  async updateItemQuantity(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateQuantityDto,
  ) {
    return this.cartService.updateItemQuantity(user.id, productId, dto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove one product from the cart' })
  @ApiParam({ name: 'productId', description: 'Product id' })
  @ApiResponse({ status: 200, description: 'Item removed' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'Product not in your cart' })
  async removeItem(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.cartService.removeItem(user.id, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Empty the cart', description: 'Removes every item; the cart itself is kept.' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @ApiResponse({ status: 401, description: 'No active session' })
  async clearCart(@CurrentUser() user: AuthUser) {
    return this.cartService.clearCart(user.id);
  }
}
