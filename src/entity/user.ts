/* eslint-disable @typescript-eslint/type-annotation-spacing */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinTable,
} from "typeorm";
import { Length, IsEmail } from "class-validator";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { Company } from "./company";
import { Payment } from "./payment";
import { Token } from "./token";
import { Member } from "./member";
import { Folder } from "./folder";
import { Order } from "./order";
import { MusicLike } from "./musicLike";
import { Latest } from "./latest";
import { Music } from "./music";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  //name
  @Column({
    nullable: true,
  })
  name: string;

  //email
  @Column()
  @IsEmail()
  email: string;

  //password
  @Column({
    nullable: true,
  })
  password: string;

  //create Date
  @CreateDateColumn()
  craetedAt: Date;

  //update Date
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne((type) => Company, (company) => company.index)
  @JoinColumn({ name: "company_index" })
  company: Company;

  @OneToOne((type) => Payment, (payment) => payment.index)
  @JoinColumn({ name: "payment_index" })
  payment: Payment;

  @OneToOne((type) => Token, (token) => token.index)
  @JoinColumn({ name: "token_index" })
  token: Token;

  @OneToOne((type) => Member, (member) => member.index)
  @JoinColumn({ name: "member_index" })
  member: Member;

  @OneToMany((type) => Folder, (folder) => folder.user, {
    cascade: true,
  })
  @JoinColumn({ name: "folder_index" })
  folder: Folder[];

  @OneToMany((type) => MusicLike, (musiclike) => musiclike.id, {
    cascade: true,
  })
  @JoinColumn()
  musiclike: MusicLike[];

  @OneToMany((type) => Latest, (latest) => latest.user, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "latest_index" })
  latest: Latest[];

  @OneToMany(() => Order, (order) => order.user)
  order: Order[];

  @ManyToMany((type) => Music, (music) => music.user, { cascade: true })
  music: Music;
}

export const userSchema = {
  id: { type: "number", required: true, example: 1 },
  name: { type: "string", required: false, example: "Javier" },
  email: {
    type: "string",
    required: true,
    example: "avileslopezjavier@gmail.com",
  },
  password: {
    type: "string",
    required: false,
  },
};

//password hashed before input db
export async function hashedPassword(passowrd: any) {
  return await crypto
    .createHmac("sha256", process.env.SECRET_KEY)
    .update(passowrd)
    .digest("hex");
}

//compare login input password & db.password
export async function comparePassword(password: any, passwordConfirm: any) {
  const hahsed = await hashedPassword(passwordConfirm);
  return password === hahsed;
}

export const generateToken = () => {
  const random = crypto.randomBytes(21).toString("base64").slice(0, 21);
  const token = jwt.sign({ random }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

export const generateRefresh = () => {
  const random = crypto.randomBytes(21).toString("base64").slice(0, 21);
  const token = jwt.sign({ random }, process.env.JWT_SECRET);
  return token;
};
