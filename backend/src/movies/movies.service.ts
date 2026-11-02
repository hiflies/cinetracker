import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movie.entity';

@Injectable()
export class MoviesService {
  constructor(@InjectRepository(Movie) private readonly movies: Repository<Movie>) {}

  findAll() {
    return this.movies.find({ order: { id: 'ASC' } });
  }
}
