/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
} from "typeorm";
import { Music } from "./music";

import { User } from "./user";

@Entity()
export class MusicLike extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  like: boolean;

  @ManyToOne((type) => User, (user) => user.musiclike)
  @JoinColumn()
  user: User;

  @ManyToOne((type) => Music, (music) => music.musiclike, { cascade: true })
  @JoinColumn({ name: "music_index" })
  music: Music;

  @CreateDateColumn()
  createdat: Date;

  @UpdateDateColumn()
  updatedat: Date;
}
