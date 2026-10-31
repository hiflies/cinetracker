import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { User } from './user.entity';

export const AUTH_COOKIE = 'token';

@Injectable()
export class CookieAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = await this.auth.userFromToken(req.cookies?.[AUTH_COOKIE]);
    if (!user) throw new UnauthorizedException();
    req.user = user;
    return true;
  }
}
