import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Movie } from '../movies/movie.entity';
import { List } from './list.entity';

@Entity()
export class ListMovie {
  @PrimaryColumn()
  listId: number;

  @PrimaryColumn()
  movieId: number;

  @Column()
  position: number;

  @ManyToOne(() => List, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listId' })
  list: List;

  @ManyToOne(() => Movie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movieId' })
  movie: Movie;
}
