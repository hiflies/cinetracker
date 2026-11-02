import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { IsNull, Repository } from 'typeorm';
import { Movie } from '../movies/movie.entity';
import { ListMovie } from './list-movie.entity';
import { List } from './list.entity';

export const TOP_250 = 'Top 250';

type SeedMovie = Omit<Movie, 'id'> & { rank: number };

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    @InjectRepository(List) private readonly lists: Repository<List>,
    @InjectRepository(ListMovie) private readonly listMovies: Repository<ListMovie>,
  ) {}

  async onApplicationBootstrap() {
    const data: SeedMovie[] = JSON.parse(readFileSync(join(process.cwd(), 'data', 'top250.json'), 'utf8'));

    // the chart rank doubles as the movie id, so ids stay stable across re-seeds
    if ((await this.movies.count()) === 0) {
      await this.movies.insert(data.map(({ rank, ...m }) => ({ id: rank, ...m })));
      this.logger.log(`Seeded ${data.length} movies`);
    }

    if (!(await this.lists.existsBy({ name: TOP_250, ownerId: IsNull() }))) {
      const list = await this.lists.save({ name: TOP_250, ownerId: null });
      await this.listMovies.insert(data.map((m) => ({ listId: list.id, movieId: m.rank, position: m.rank })));
      this.logger.log(`Created list "${TOP_250}"`);
    }
  }
}
