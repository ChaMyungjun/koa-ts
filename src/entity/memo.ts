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
  ManyToMany,
} from "typeorm";
import { Folder } from "./folder";
import { Music } from "./music";
import { User } from "./user";

@Entity()
export class FolderMusic extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  memo: string;

  @ManyToOne((type) => Music, (music) => music.folderMusic, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "music_index" })
  music?: Music;

  @ManyToOne((type) => Folder, (folder) => folder.folderMusic, {
    cascade: true,
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "folder_index" })
  folder?: Folder;

  @CreateDateColumn()
  createdat: Date;

  @UpdateDateColumn()
  updatedat: Date;
}
