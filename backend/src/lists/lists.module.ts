import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Movie } from '../movies/movie.entity';
import { ListMovie } from './list-movie.entity';
import { List } from './list.entity';
import { ListsController } from './lists.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([List, ListMovie, Movie]), AuthModule],
  controllers: [ListsController],
  providers: [SeedService],
})
export class ListsModule {}
