import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Get admin dashboard statistics',
    description:
      'ADMIN only. Totals, order counts by status, revenue, low stock products, top sellers, and the latest orders, computed live from the database.',
  })
  @ApiResponse({ status: 200, description: 'Dashboard statistics returned' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
