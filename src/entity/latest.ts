/* eslint-disable @typescript-eslint/no-unused-vars */
import { ClientRequest } from "http";
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
export class Latest extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  @Column()
  id: number;

  @Column()
  name: string;

  @Column()
  image: string;

  @Column()
  artist: string;

  @Column()
  genre: string;

  @Column()
  audioUrl: string;

  @Column()
  username: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany((type) => User, (user) => user.latest)
  user: User;
}
