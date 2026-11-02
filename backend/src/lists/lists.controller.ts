import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { AUTH_COOKIE, CookieAuthGuard } from '../auth/cookie-auth.guard';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.entity';
import { Movie } from '../movies/movie.entity';
import { ListMovie } from './list-movie.entity';
import { List } from './list.entity';

type AuthedRequest = Request & { user: User };

@Controller('lists')
export class ListsController {
  constructor(
    @InjectRepository(List) private readonly lists: Repository<List>,
    @InjectRepository(ListMovie) private readonly listMovies: Repository<ListMovie>,
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    private readonly auth: AuthService,
  ) {}

  private currentUser(req: Request) {
    return this.auth.userFromToken(req.cookies?.[AUTH_COOKIE]);
  }

  private async findReadable(id: number, user: User | null) {
    const list = await this.lists.findOneBy({ id });
    if (!list || (list.ownerId !== null && list.ownerId !== user?.id)) throw new NotFoundException('List not found');
    return list;
  }

  private async findOwned(id: number, user: User) {
    const list = await this.lists.findOneBy({ id });
    if (!list) throw new NotFoundException('List not found');
    if (list.ownerId !== user.id) throw new ForbiddenException('Not your list');
    return list;
  }

  /** Built-in lists plus, when logged in, the user's own lists. */
  @Get()
  async findAll(@Req() req: Request) {
    const user = await this.currentUser(req);
    const lists = await this.lists
      .createQueryBuilder('l')
      .where('l.ownerId IS NULL')
      .orWhere('l.ownerId = :uid', { uid: user?.id ?? -1 })
      .orderBy('l.ownerId IS NULL', 'DESC')
      .addOrderBy('l.id', 'ASC')
      .getMany();
    const counts = await this.listMovies
      .createQueryBuilder('lm')
      .select('lm.listId', 'listId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('lm.listId')
      .getRawMany<{ listId: number; count: string }>();
    const countOf = new Map(counts.map((c) => [Number(c.listId), Number(c.count)]));
    return lists.map((l) => ({
      id: l.id,
      name: l.name,
      system: l.ownerId === null,
      movieCount: countOf.get(l.id) ?? 0,
    }));
  }

  @Get(':id/movies')
  async movieList(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    await this.findReadable(id, await this.currentUser(req));
    const rows = await this.listMovies.find({
      where: { listId: id },
      relations: { movie: true },
      order: { position: 'ASC' },
    });
    return rows.map(({ position, movie: m }) => ({
      id: m.id,
      position,
      name: m.name,
      duration: m.duration,
      rating: m.rating,
      image: m.image,
      year: m.year,
    }));
  }

  @Post()
  @UseGuards(CookieAuthGuard)
  async create(@Req() req: AuthedRequest, @Body() body: { name?: unknown }) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 100) throw new BadRequestException('Name must be 1-100 characters');
    if (await this.lists.existsBy({ ownerId: req.user.id, name })) {
      throw new ConflictException('You already have a list with that name');
    }
    const list = await this.lists.save({ name, ownerId: req.user.id });
    return { id: list.id, name: list.name, system: false, movieCount: 0 };
  }

  @Delete(':id')
  @UseGuards(CookieAuthGuard)
  async remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    await this.findOwned(id, req.user);
    await this.lists.delete({ id });
    return { id, deleted: true };
  }

  @Put(':id/movies/:movieId')
  @UseGuards(CookieAuthGuard)
  async addMovie(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    await this.findOwned(id, req.user);
    if (!(await this.movies.existsBy({ id: movieId }))) throw new NotFoundException('Movie not found');
    if (!(await this.listMovies.existsBy({ listId: id, movieId }))) {
      const { max } = (await this.listMovies
        .createQueryBuilder('lm')
        .select('COALESCE(MAX(lm.position), 0)', 'max')
        .where('lm.listId = :id', { id })
        .getRawOne<{ max: string }>())!;
      await this.listMovies.insert({ listId: id, movieId, position: Number(max) + 1 });
    }
    return { listId: id, movieId, inList: true };
  }

  @Delete(':id/movies/:movieId')
  @UseGuards(CookieAuthGuard)
  async removeMovie(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    await this.findOwned(id, req.user);
    await this.listMovies.delete({ listId: id, movieId });
    return { listId: id, movieId, inList: false };
  }
}
