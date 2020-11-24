/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  OneToOne,
  JoinColumn,
} from "typeorm";
import axios from "axios";

import { User } from "./user";

@Entity()
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  //cardnumber
  @Column()
  cardNumber: string;

  //card expires day
  @Column()
  cardExpire: string;

  //user birthday
  @Column()
  birth: string;

  //card password firtst & second
  @Column()
  cardPassword2digit: string;

  //customre uid => random create
  @Column()
  customerUid: string;

  //One User save One card
  @OneToOne((type) => User, (user) => user.email)
  @JoinColumn()
  user!: User;
}

export const Paymentschema = {
  id: { type: "number", required: true, example: "1" },
  cardNumber: { type: "string", required: true, example: "12345678901" },
  cardExpire: { type: "string", required: true, example: "1225" },
  birth: { type: "string", required: true, example: "090807" },
  customerUid: { type: "string", required: true, example: "gildong_0001_1234" },
  cardPassword2digit: { type: "string", required: true, example: "1200" },
};

//customer uudi generate
export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getToken() {
  const tokenURL = "https://api.iamport.kr/users/getToken";
  const impKey = process.env.iamporter_api_key;
  const imptSecret = process.env.iamporter_api_secret;

  let token: any = null;

  await axios({
    url: tokenURL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: {
      imp_key: impKey,
      imp_secret: imptSecret,
    },
  })
    .then((res) => {
      console.log(res.data);
      token = res.data.response.access_token;
    })
    .catch((err) => {
      console.error(err.response.data);
    });
  return token;
}

export async function issueBilling(
  customeruId: any,
  accessToken: any,
  cardNumber: any,
  cardExpire: any,
  userBirth: any,
  password2digit: any
) {
  const billingURL = `https://api.iamport.kr/subscribe/customers/${customeruId}`;
  const billing = await axios({
    url: billingURL,
    method: "POST",
    headers: { Authorization: `${accessToken}` },
    data: {
      card_number: cardNumber,
      expiry: cardExpire,
      birth: userBirth,
      pwd_2digit: password2digit,
    },
  });
  return billing;
}
