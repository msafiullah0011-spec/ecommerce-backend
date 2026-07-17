import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthUser } from '../auth/types.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersService } from './orders.service.js';

// Every route in this controller requires at least a session (customer
// endpoints) and some require ADMIN on top of that, so the cookie security
// scheme is declared once at the class level; @Roles() still gates the two
// admin-only routes individually.
@ApiTags('Orders')
@ApiCookieAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Create an order from the current user's cart",
    description: 'Verifies stock, computes the total, then atomically creates the order, reduces stock, and clears the cart.',
  })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Cart is empty, or a product no longer has enough stock' })
  @ApiResponse({ status: 401, description: 'No active session' })
  async create(@CurrentUser() user: AuthUser) {
    return this.ordersService.create(user.id);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "List the current user's orders", description: 'Newest first.' })
  @ApiResponse({ status: 200, description: 'Orders returned' })
  @ApiResponse({ status: 401, description: 'No active session' })
  async findAll(@CurrentUser() user: AuthUser) {
    return this.ordersService.findAllForUser(user.id);
  }

  // Declared before ':id' on purpose: a static segment must be registered
  // ahead of a dynamic param at the same position, or '/orders/all' would
  // match the ':id' route with id === 'all'.
  @Get('all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List every order in the system', description: 'ADMIN only. Newest first.' })
  @ApiResponse({ status: 200, description: 'Orders returned' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async findAllAdmin() {
    return this.ordersService.findAllAdmin();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get one of the current user’s orders',
    description: "Returns 404 both when the order doesn't exist and when it belongs to someone else.",
  })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiResponse({ status: 200, description: 'Order returned' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.findOneForUser(user.id, id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update an order status', description: 'ADMIN only.' })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiResponse({ status: 200, description: 'Order updated' })
  @ApiResponse({ status: 400, description: 'Validation failed (invalid status value)' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
