import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Movie } from '../movies/movie.entity';
import { WatchedController } from './watched.controller';
import { Watched } from './watched.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Watched, Movie]), AuthModule],
  controllers: [WatchedController],
})
export class WatchedModule {}
