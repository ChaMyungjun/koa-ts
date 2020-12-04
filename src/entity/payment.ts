/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import axios from "axios";
import { access } from "fs";
import { User } from "./user";

@Entity()
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  //cardnumber
  @Column()
  cardNumber: string;

  //card Type
  @Column()
  cardType: string;

  @Column({ nullable: true })
  corporationType: string;

  @Column({ nullable: true })
  merchantUid: string;

  //customre uid => random create
  @Column()
  customerUid: string;

  //create Date
  @CreateDateColumn()
  createdAt: Date;

  @OneToOne((type) => User, (user) => user.payment)
  user: User;
}

export const Paymentschema = {
  id: { type: "number", required: true, example: "1" },
  cardNumber: { type: "string", required: true, example: "12345678901" },
  cardExpire: { type: "string", required: true, example: "1225" },
  birth: { type: "string", required: true, example: "090807" },
  customerUid: { type: "string", required: true, example: "gildong_0001_1234" },
  cardPassword2digit: { type: "string", required: true, example: "1200" },
  cardType: { type: "string", required: true, exmpale: "1" },
};

//customer uudi generate
export async function uuidv4() {
  const character = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return character.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getToken() {
  const tokenURL = "https://api.iamport.kr/users/getToken";
  const impKey = process.env.iamporter_api_key;
  const impSecret = process.env.iamporter_api_secret;

  let token: any = null;

  await axios({
    url: tokenURL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: {
      imp_key: impKey,
      imp_secret: impSecret,
    },
  })
    .then((res) => {
      token = res.data.response.access_token;
    })
    .catch((err) => {
      console.error(err.response.data.message);
    });
  return token;
}

export async function issueBilling(
  customer_uid: any,
  accessToken: any,
  cardNumber: any,
  cardExpire: any,
  userBirth: any,
  password2digit: any,
  merchant_uid: any,
  amount: any
) {
  const billingURL = `https://api.iamport.kr/subscribe/customers/${customer_uid}`;
  const firstPaymentURL = "https://api.iamport.kr/subscribe/payments/onetime/";
  let firstPay: any = null;
  let billingPay: any = null;
  let allPay: any = null;

  try {
    await axios({
      url: firstPaymentURL,
      method: "POST",
      headers: { Authorization: accessToken },
      data: {
        card_number: cardNumber,
        expiry: cardExpire,
        merchant_uid: merchant_uid,
        amount: amount,
        birth: userBirth,
        customer_uid: customer_uid,
        pwd_2digit: password2digit,
        name: "월간 이용권 결제",
      },
    })
      .then((res) => {
        firstPay = res.data;
      })
      .catch((err) => {
        firstPay = err.response.data;
      });
  } catch (err) {
    allPay = err.response.data;
  }
  return { billingPay, firstPay, allPay };
}

export async function normalPayment(
  accessToken: any,
  customerUid: any,
  merchantUid: any,
  amount: any,
  name: any
) {
  const paymentURL = "https://api.iamport.kr/subscribe/payments/again";

  await axios({
    url: paymentURL,
    method: "POST",
    headers: { Authorization: accessToken },
    data: {
      customer_uid: customerUid,
      merchant_uid: merchantUid,
      amount,
      name,
    },
  })
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      console.error(err);
    });
}

/**
 *
 *
 * CompanyInfoPage => company:string, name: string, position:string, phone:string, email:string, business: {file: jpg,png , path: ''"}
 *
 */
