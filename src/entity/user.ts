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
} from "typeorm";
import { Length, IsEmail } from "class-validator";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { Company } from "./company";
import { Payment } from "./payment";
import { Token } from "./token";

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
  email: string;

  //password
  @Column({
    nullable: true,
  })
  password: string;

  @OneToOne((type) => Company, (company) => company.index, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  company: Company[];

  @OneToOne((type) => Payment, (payment) => payment.index, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  payment: Payment;

  @OneToOne((type) => Token, (token) => token.index, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "token_index" })
  token: Token;
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
export function hashedPassword(passowrd: any) {
  return crypto
    .createHmac("sha256", process.env.SECRET_KEY)
    .update(passowrd)
    .digest("hex");
}

//compare login input password & db.password
export function comparePassword(password: any, passwordConfirm: any) {
  const hahsed = hashedPassword(passwordConfirm);
  return password === hahsed;
}

export const generateToken = (name: any, email: any, password: any) => {
  const token = jwt.sign({ name, email, password }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
};

export const generateRefresh = (name: any, email: any) => {
  const token = jwt.sign({ name, email }, process.env.JWT_SECRET);
  return token;
};

export const reGenerateToken = (refresh: any) => {
  const token = jwt.sign({ refresh }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
};
