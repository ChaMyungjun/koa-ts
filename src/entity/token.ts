/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { Length } from "class-validator";
import jwt from "jsonwebtoken";

@Entity()
export class Token extends BaseEntity {
  //priimary Key
  @PrimaryGeneratedColumn()
  index: number;

  //token_site
  @Column({
    length: 20,
  })
  @Length(5, 10)
  tokenProvider: string;

  //social ID number => member ID
  @Column()
  Id: number;

  //access_token
  @Column({
    nullable: true,
  })
  @Length(0, 400)
  token: string;

  //refresh_token
  @Column({
    nullable: true,
  })
  @Length(0, 400)
  reToken: string;
}

//token schema
export const tokenSchema = {
  index: { type: "number", required: true, example: 1 },
  tokenProvider: { type: "string", required: true, example: "kakao" },
  Id: { type: "number", required: true, example: 1234124 },
  token: { type: "string", required: true, exmpale: "asdfasdfasdfasdfasdf" },
  retoken: { type: "string", example: "asdfsdafsdfasdfasdfasdfasd" },
};

//token encoded => converting
export function encoded(access: any) {
  const socialToken = jwt.sign({ access }, process.env.SECRET_KEY, {
    expiresIn: "7d",
    issuer: "Koa",
    subject: "token",
  });
  console.log("token value:", socialToken);
  return socialToken;
}

export function decoded(token: any) {
  const decodeToken = new Promise((resolve: any, reject: any) => {
    jwt.verify(token, process.env.SECRET_KEY, (err: any, decoded: any) => {
      if (err) reject(err);
      resolve(decoded);
    });
  });
  return decodeToken;
}
