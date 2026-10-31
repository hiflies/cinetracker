import { ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isGoogleConfigured } from './google.strategy';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    if (!isGoogleConfigured()) {
      throw new ServiceUnavailableException('Google login is not configured (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)');
    }
    return super.canActivate(context);
  }
}
