import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleProfile } from './google.strategy';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async loginWithGoogle(profile: GoogleProfile) {
    const existing = await this.users.findOneBy({ googleId: profile.googleId });
    const user = await this.users.save({ ...existing, ...profile });
    return this.jwt.signAsync({ sub: user.id });
  }

  async userFromToken(token?: string) {
    if (!token) return null;
    try {
      const { sub } = await this.jwt.verifyAsync<{ sub: number }>(token);
      return await this.users.findOneBy({ id: sub });
    } catch {
      return null;
    }
  }
}
