import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Watched {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  movieId: number;

  @CreateDateColumn()
  watchedAt: Date;
}
