/* eslint-disable @typescript-eslint/camelcase */
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
import axios from "axios";
import { TextDecoder } from "util";
import { createContext } from "vm";
import { ConsoleTransportOptions } from "winston/lib/winston/transports";

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

  @Column({
    nullable: true,
  })
  expire: number;

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

export async function naverGenerateToken(state: any, code: any) {
  console.log(state, code);
  const GENERATE_TOKEN_NAVER = `https://nid.naver.com/oauth2.0/token?client_id=${process.env.naver_rest_api}&client_secret=${process.env.naver_secret_key}&grant_type=authorization_code&state=${state}&code=${code}`;
  let data: any = null;

  //nid.naver.com/oauth2.0/token?client_id={클라이언트 아이디}&client_secret={클라이언트 시크릿}&grant_type=authorization_code&state={상태 토큰}&code={인증 코드}
  await axios
    .post(GENERATE_TOKEN_NAVER)
    .then((res) => {
      //console.log("res token data", res.data);
      data = res.data;
    })
    .catch((err) => {
      console.error("Error:", err.data);
    });

  console.log(data);
  return data;
}

export async function naverGenerateProfile(access_token: any) {
  console.log(access_token);
  const GENERATE_PROFILE_NAVER = "https://openapi.naver.com/v1/nid/me";
  let data: any = null;

  await axios
    .get(GENERATE_PROFILE_NAVER, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    .then((res) => {
      //console.log("res profile data", res.data);
      data = res.data;
    })
    .catch((err) => {
      console.error("Error: ", err.response.data);
    });
  console.log(data);

  return data;
}

/**
 *
 * test { access: 'asdfasdf', iat: 1605842181, exp: 1606446981 }
 *
 */
