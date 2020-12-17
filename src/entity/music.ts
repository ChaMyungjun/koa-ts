/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 *
 * 노래: id:num, image, name: string, artist: string, genre:string, price,
 *
 */

import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  JoinTable,
} from "typeorm";
import { Folder } from "./folder";
import { Latest } from "./latest";
import { FolderMusic } from "./memo";
import { MusicLike } from "./musicLike";
import { User } from "./user";

@Entity()
export class Music extends BaseEntity {
  @PrimaryGeneratedColumn()
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
  audioUrl: string;

  @Column()
  price: number;

  // @Column()
  // like: boolean;

  @OneToMany((type) => MusicLike, (musiclike) => musiclike.music)
  @JoinColumn({ name: "musicliked_index" })
  musiclike: MusicLike;

  // @OneToMany((type) => Folder, (folder) => folder.music)
  // @JoinColumn({ name: "folder_index" })
  // folder: Folder;

  @OneToMany((type) => FolderMusic, (folderMusic) => folderMusic.music)
  @JoinColumn({ name: "memo_index" })
  folderMusic: FolderMusic;

  @OneToMany((type) => Latest, (latest) => latest.music)
  @JoinColumn({ name: "latest_index" })
  latest: Latest[];

  // @ManyToMany((type) => User, (user) => user.music)
  // @JoinTable({ name: "user_index" })
  // user: User[];

  @CreateDateColumn()
  createdat: Date;

  @UpdateDateColumn()
  updatedat: Date;
}

export const musicSchema = {
  index: { type: "number", required: true, example: 1 },
  id: { type: "number", required: true, example: 1 },
  image: { type: "string", required: true, example: "asdfasdfasdfasdf" },
  name: { type: "string", required: true, example: "asdf" },
  artist: { type: "string", required: true, example: "asdfwert" },
  genre: { type: "string", required: true, example: "asdf" },
  price: { type: "number", required: true, example: 1235 },
};
