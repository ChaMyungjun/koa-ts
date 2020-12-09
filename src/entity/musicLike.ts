/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

import { User } from "./user";

@Entity()
export class MusicLike extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  @Column()
  name: string;

  @Column()
  image: string;

  @Column()
  artiest: string;

  @Column()
  genre: string;

  @Column({ nullable: true })
  audioUrl: string;

  @Column()
  like: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany((type) => User, (user) => user.musiclike)
  user: User;
}
