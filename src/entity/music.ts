/**
 *
 * 노래: id:num, image, name: string, artist: string, genre:string, price,
 *
 */

import { Entity, Column, BaseEntity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Music extends BaseEntity {
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
  time: string;

  @Column()
  price: number;

  @Column({ nullable: true })
  errorText: string;

  @Column({ nullable: true })
  url: "";
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
