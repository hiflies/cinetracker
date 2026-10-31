import { Controller, Delete, Get, NotFoundException, ParseIntPipe, Param, Put, Req, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { CookieAuthGuard } from '../auth/cookie-auth.guard';
import { User } from '../auth/user.entity';
import { Movie } from '../movies/movie.entity';
import { Watched } from './watched.entity';

type AuthedRequest = Request & { user: User };

@Controller('watched')
@UseGuards(CookieAuthGuard)
export class WatchedController {
  constructor(
    @InjectRepository(Watched) private readonly watched: Repository<Watched>,
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
  ) {}

  @Get()
  async list(@Req() req: AuthedRequest) {
    const rows = await this.watched.findBy({ userId: req.user.id });
    return rows.map((r) => r.movieRank);
  }

  @Put(':rank')
  async mark(@Req() req: AuthedRequest, @Param('rank', ParseIntPipe) rank: number) {
    if (!(await this.movies.existsBy({ rank }))) throw new NotFoundException('Movie not found');
    await this.watched.save({ userId: req.user.id, movieRank: rank });
    return { rank, watched: true };
  }

  @Delete(':rank')
  async unmark(@Req() req: AuthedRequest, @Param('rank', ParseIntPipe) rank: number) {
    await this.watched.delete({ userId: req.user.id, movieRank: rank });
    return { rank, watched: false };
  }
}
