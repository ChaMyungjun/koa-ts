/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
} from "typeorm";

import axios from "axios";
import { getToken } from "./payment";

@Entity()
export class Member extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  @Column()
  member: string;

  @Column()
  merchantUid: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  method: string;

  @Column({ nullable: true })
  failedReason: string;

  @Column({ nullable: true })
  amount: number;

  @Column()
  scheduledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export const Memberschema = {
  id: { type: "number", required: true, example: 1 },
  member: { type: "string", required: true, example: "free" },
  createdAt: { type: "date", required: true, example: "2020-12-02" },
};

export async function meruuid4() {
  const character = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return character.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function bookedPayment(
  customerUid: any,
  merchantUid: any,
  amount: any,
  Name: any
) {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setHours(9);
  //  date.setMinutes();
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
