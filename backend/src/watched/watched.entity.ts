import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Watched {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  movieRank: number;

  @CreateDateColumn()
  watchedAt: Date;
}
