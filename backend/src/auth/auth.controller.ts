import { Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { AUTH_COOKIE as COOKIE } from './cookie-auth.guard';
import { GoogleProfile } from './google.strategy';


@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  google() {
    // redirects to Google via the guard
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const token = await this.auth.loginWithGoogle(req.user as GoogleProfile);
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
    res.redirect('/');
  }

  @Get('me')
  async me(@Req() req: Request) {
    const user = await this.auth.userFromToken(req.cookies?.[COOKIE]);
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, name: user.name, picture: user.picture };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE);
    return { ok: true };
  }
}
