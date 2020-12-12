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
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Music } from "./music";
import { User } from "./user";

@Entity()
export class Latest extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  @ManyToOne((type) => User, (user) => user.latest, {
    cascade: true,
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "user_index" })
  user: User;

  @ManyToOne((type) => Music, (music) => music.latest)
  @JoinColumn()
  music: Music[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
