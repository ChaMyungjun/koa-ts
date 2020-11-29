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
} from "typeorm";
import jwt from "jsonwebtoken";
import { User } from "./user";

@Entity()
export class Token extends BaseEntity {
  //priimary Key
  @PrimaryGeneratedColumn()
  index: number;

  //token_site
  @Column()
  tokenProvider: string;

  //social ID number => member ID
  @Column()
  Id: number;

  //access_token
  @Column()
  token: string;

  //refresh_token
  @Column()
  reToken: string;

  //create Date
  @CreateDateColumn()
  createdAt: Date;

  @OneToOne((type) => User, (user) => user.token)
  user: User;
}

//token schema
// export const tokenSchema = {
//   index: { type: "number", required: true, example: 1 },
//   tokenProvider: { type: "string", required: true, example: "kakao" },
//   Id: { type: "number", required: true, example: 1234124 },
//   token: { type: "string", required: true, exmpale: "asdfasdfasdfasdfasdf" },
//   retoken: { type: "string", example: "asdfsdafsdfasdfasdfasdfasd" },
// };

//token encoded => converting
export function encoded(access: any) {
  const socialToken = jwt.sign({ access }, process.env.SECRET_KEY, {
    expiresIn: "1h",
  });
  return socialToken;
}

//refresh token converting (expiresIn none)
export function reencoded(refresh: any) {
  const socialRefreshToken = jwt.sign({ refresh }, process.env.SECRET_KEY);
  return socialRefreshToken;
}

export function decoded(token: any) {
  let decodeToken: any = null;
  jwt.verify(token, process.env.SECRET_KEY, function (err: any, value: any) {
    if (err) {
      console.error(err);
    }
    decodeToken = value;
  });
  return decodeToken;
}

/**
 *
 * test { access: 'asdfasdf', iat: 1605842181, exp: 1606446981 }
 *
 */
