import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { slidingWindow, WithArcjetRules } from '@arcjet/nest';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { AuthGuard } from './guards/auth.guard.js';
import type { AuthUser } from './types.js';

const arcjetMode = process.env.ARCJET_MODE === 'LIVE' ? 'LIVE' : 'DRY_RUN';

// Stricter than the app's global 60/min rule (see app.module.ts): signup and
// login are the highest abuse risk endpoints (credential stuffing, signup
// spam), layered on top of the global ArcjetGuard. Applied per method, not
// per controller, so /auth/me and /auth/logout keep the normal global limit.
const strictAuthRateLimit = [
  slidingWindow({
    mode: arcjetMode,
    interval: '1m',
    max: 5,
    characteristics: ['ip.src'],
  }),
];

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @WithArcjetRules(strictAuthRateLimit)
  @ApiOperation({
    summary: 'Create a new account',
    description:
      'Creates a CUSTOMER account (role is never client settable) and automatically logs the new user in, setting a session cookie.',
  })
  @ApiResponse({ status: 201, description: 'Account created and session started' })
  @ApiResponse({ status: 400, description: 'Validation failed (invalid email, short password, etc.)' })
  @ApiResponse({ status: 409, description: 'Email is already registered' })
  async signUp(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.signUp(dto, res);
  }

  @Post('login')
  @HttpCode(200)
  @WithArcjetRules(strictAuthRateLimit)
  @ApiOperation({ summary: 'Log in', description: 'Verifies credentials and starts a session.' })
  @ApiResponse({ status: 200, description: 'Session started' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Log out', description: 'Invalidates the current session.' })
  @ApiResponse({ status: 200, description: 'Session invalidated' })
  @ApiResponse({ status: 401, description: 'No active session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req, res);
    return { loggedOut: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get the current user', description: "Returns the authenticated user's identity." })
  @ApiResponse({ status: 200, description: 'Current user returned' })
  @ApiResponse({ status: 401, description: 'No active session' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
