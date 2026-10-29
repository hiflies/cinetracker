import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Movie } from './movie.entity';

@Injectable()
export class MoviesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MoviesService.name);

  constructor(@InjectRepository(Movie) private readonly movies: Repository<Movie>) {}

  async onApplicationBootstrap() {
    if ((await this.movies.count()) > 0) return;
    const data: Movie[] = JSON.parse(readFileSync(join(process.cwd(), 'data', 'top250.json'), 'utf8'));
    await this.movies.save(data);
    this.logger.log(`Seeded ${data.length} movies`);
  }

  findAll() {
    return this.movies.find({ order: { rank: 'ASC' } });
  }
}
