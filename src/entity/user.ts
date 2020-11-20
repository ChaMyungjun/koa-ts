/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { Length, IsEmail } from "class-validator";
import crypto from "crypto";
import jwt from "jsonwebtoken";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  //name
  @Column({
    length: 80,
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
    length: 100,
  })
  @Length(6, 100)
  password: string;
}

export const userSchema = {
  id: { type: "number", required: true, example: 1 },
  name: { type: "string", required: true, example: "Javier" },
  email: {
    type: "string",
    required: true,
    example: "avileslopezjavier@gmail.com",
  },
  password: {
    type: "string",
    required: true,
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

// export const reGenerateToken = (refresh: any) => {
//   const token = 
// }