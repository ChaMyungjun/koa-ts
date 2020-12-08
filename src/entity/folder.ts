/* eslint-disable @typescript-eslint/no-unused-vars */
import { Collection } from "iamport-rest-client-nodejs/dist/response";
import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { User } from "./user";

@Entity()
export class Folder extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  @Column()
  id: number;

  @Column()
  image: string;

  @Column()
  name: string;

  @Column()
  artist: string;

  @Column()
  genre: string;

  @Column({ nullable: true })
  memo: string;

  @Column()
  title: string;

  @ManyToOne((type) => User, (user) => user.folder)
  user: User;
}
