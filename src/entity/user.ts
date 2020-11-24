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
import { flat } from "admin-bro";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  //name
  @Column({
    nullable: true,
  })
  @Length(3, 80)
  name: string;

  //email
  @Column({
    length: 100,
  })
  @IsEmail()
  email: string;

  //password
  @Column({
    nullable: true,
  })
  @Length(6, 100)
  password: string;

  @OneToOne(() => Company, (company) => company.user)
  @JoinColumn()
  company: Company;

  @OneToOne(() => Payment, (payment) => payment.user)
  @JoinColumn()
  payment: Payment;

  @OneToOne(() => Token, (token) => token.user)
  @JoinColumn()
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
