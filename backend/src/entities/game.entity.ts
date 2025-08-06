import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  developer: string;

  @Column({ nullable: true })
  publisher: string;

  @Column({ nullable: true })
  releaseYear: number;

  @Column({ nullable: true })
  genre: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column()
  fileSize: number;

  @Column({ default: 'uploaded' }) // uploaded, processed, metadata_found, ready
  status: string;

  @Column({ nullable: true })
  igdbId: number;

  @Column({ nullable: true })
  rawgId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
