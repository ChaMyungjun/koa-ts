/* eslint-disable @typescript-eslint/no-unused-vars */
import { Collection } from "iamport-rest-client-nodejs/dist/response";
import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Music } from "./music";
import { User } from "./user";

@Entity()
export class Folder extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  memo: string;

  @Column({ nullable: true })
  title: string;

  @ManyToOne((type) => Music, (music) => music.folder, {
    nullable: true,
    onDelete: "SET NULL",
    cascade: true,
  })
  @JoinColumn({ name: "music_index" })
  music?: Music;

  @ManyToOne((type) => User, (user) => user.folder, {
    nullable: true,
    onDelete: "SET NULL",
    cascade: true,
  })
  @JoinColumn({ name: "user_index" })
  user?: User;

  @CreateDateColumn()
  createdat: Date;

  @UpdateDateColumn()
  updatedat: Date;
}
