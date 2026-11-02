import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  duration: string;

  @Column()
  durationSeconds: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  rating: number;

  @Column({ length: 512 })
  image: string;

  @Column()
  year: number;
}
