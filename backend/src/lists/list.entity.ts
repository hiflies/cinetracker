import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** ownerId === null marks a built-in list (e.g. "Top 250") that nobody can edit. */
@Entity()
export class List {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'int', nullable: true })
  ownerId: number | null;
}
