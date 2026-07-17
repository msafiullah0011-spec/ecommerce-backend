import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { APIError } from 'better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.config.js';
import { LoginDto } from './dto/login.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import type { AuthUser } from './types.js';

function forwardSetCookie(headers: Headers, res: Response) {
  for (const cookie of headers.getSetCookie()) {
    res.appendHeader('Set-Cookie', cookie);
  }
}

function toAuthUser(user: { id: string; name: string; email: string; role?: string }): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: (user.role as AuthUser['role']) ?? 'CUSTOMER',
  };
}

@Injectable()
export class AuthService {
  async signUp(dto: SignUpDto, res: Response): Promise<AuthUser> {
    try {
      const { headers, response } = await auth.api.signUpEmail({
        body: { name: dto.name, email: dto.email, password: dto.password },
        returnHeaders: true,
      });
      forwardSetCookie(headers, res);
      return toAuthUser(response.user);
    } catch (error) {
      if (error instanceof APIError) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async login(dto: LoginDto, res: Response): Promise<AuthUser> {
    try {
      const { headers, response } = await auth.api.signInEmail({
        body: { email: dto.email, password: dto.password },
        returnHeaders: true,
      });
      forwardSetCookie(headers, res);
      return toAuthUser(response.user);
    } catch (error) {
      if (error instanceof APIError) {
        // Deliberately generic: never reveal whether the email exists.
        throw new UnauthorizedException('Invalid email or password');
      }
      throw error;
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { headers } = await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
      returnHeaders: true,
    });
    forwardSetCookie(headers, res);
  }
}
