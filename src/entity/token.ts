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
    nullable: false,
  })
  @Length(0, 400)
  token: string;

  //refresh_token
  @Column({
    nullable: false,
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
    expiresIn: "1h",
  });
  console.log("token value:", socialToken);
  return socialToken;
}

//refresh token converting (expiresIn none)
export function reencoded(refresh: any) {
  const socialRefreshToken = jwt.sign({ refresh }, process.env.SECRET_KEY);
  console.log("refresh token value:", socialRefreshToken);
  return socialRefreshToken;
}

export function decoded(token: any) {
  let decodeToken: any = null;
  jwt.verify(token, process.env.SECRET_KEY, function (err: any, value: any) {
    if (err) {
      console.error(err);
    }
    console.log(value);
    decodeToken = value;
  });
  return decodeToken;
}

/**
 *
 * test { access: 'asdfasdf', iat: 1605842181, exp: 1606446981 }
 *
 */
