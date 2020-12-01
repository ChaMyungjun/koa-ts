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
  AdvancedConsoleLogger,
  CreateDateColumn,
} from "typeorm";
import axios from "axios";

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

  //customre uid => random create
  @Column()
  customerUid: string;

  //create Date
  @CreateDateColumn()
  createdAt: Date;
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
      token = res.data.response.access_token;
    })
    .catch((err) => {
      console.error(err.response.data.message);
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
  const billingURL = `https://api.iamport.kr/subscribe/customers/s${customeruId}`;
  const firstPaymentURL = "https://api.iamport.kr/subscribe/payments/onetime/";
  try {
    let firstPayment, paymentResult;

    await axios({
      url: firstPaymentURL,
      method: "POST",
      headers: { Authorization: `${accessToken}` },
      data: {
        card_number: cardNumber,
        expiry: cardExpire,
        merchant_uid: "order_monthly_001",
        amount: 200,
        name: "월간 이용권 결제",
      },
    }).then((res) => {
      firstPayment = res;
    });

    await axios({
      url: billingURL,
      method: "POST",
      headers: { Authorization: `${accessToken}` },
      data: {
        card_number: cardNumber,
        expiry: cardExpire,
        birth: userBirth,
        pwd_2digit: password2digit,
      },
    }).then((res) => {
      paymentResult = res;
    });

    return { firstPayment, paymentResult };
  } catch (err) {
    console.error("Error");
  }
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

export async function bookedPayment(
  customerUid: any,
  merchantUid: any,
  amount: any,
  Name: any,
  buyerEmail: any
) {
  const date = new Date();
  date.setMonth(date.getMonth() + 2);
  const timeStamp = Math.floor(date.getTime() / 1000);
  const bookedURL = "https://api.iamport.kr/subscribe/payments/schedule";
  await axios({
    url: bookedURL,
    method: "post",
    headers: { Authorization: await getToken() },
    data: {
      customer_uid: customerUid,
      schedules: [
        {
          merchant_uid: merchantUid,
          schedule_at: timeStamp,
          amount: amount,
          name: Name,
          buyer_email: buyerEmail,
        },
      ],
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
