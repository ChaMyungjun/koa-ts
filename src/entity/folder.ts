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

  @Column("simple-json", { nullable: true })
  id: { id: number };

  @Column("simple-json", { nullable: true })
  image: { image: string };

  @Column("simple-json", { nullable: true })
  name: { name: string };

  @Column("simple-json", { nullable: true })
  artist: { artist: string };

  @Column("simple-json", { nullable: true })
  genre: { genre: string };

  @Column("simple-json", { nullable: true })
  time: { time: string };

  @Column("simple-json", { nullable: true })
  memo: { memo: string };

  @Column()
  title: string;

  @ManyToOne((type) => User, (user) => user.folder)
  user: User;
}
