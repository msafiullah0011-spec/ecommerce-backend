import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import type { AuthUser } from '../auth/types.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: "Get the current user's profile",
    description: "Fetches the authenticated user's full profile from the database (not just the session).",
  })
  @ApiResponse({ status: 200, description: 'Profile returned' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.id);
  }
}
