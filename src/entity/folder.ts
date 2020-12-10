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

  @OneToMany((type) => Music, (music) => music.folder)
  @JoinColumn({ name: "music_index" })
  music?: Music[];

  @OneToMany((type) => User, (user) => user.folder)
  @JoinColumn({ name: "user_index" })
  user?: User[];
}
