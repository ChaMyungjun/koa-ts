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
import { User } from "./user";

@Entity()
export class Folder extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  @Column({ nullable: true })
  id: number;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  artist: string;

  @Column({ nullable: true })
  genre: string;

  @Column({ nullable: true })
  memo: string;

  @Column({ nullable: true })
  title: string;

  @OneToMany((type) => User, (user) => user.folder)
  user: User;
}
