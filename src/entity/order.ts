/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ClientRequest } from "http";
import { Collection } from "iamport-rest-client-nodejs/dist/response";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { collect } from "underscore";
import { User } from "./user";
import axios from "axios";
import { getToken } from "./payment";

@Entity()
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  @Column()
  member: string;

  @Column()
  merchantUid: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  orderTitle: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  method: string;

  @Column({ nullable: true })
  failedReason: string;

  @Column({ nullable: true })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne((type) => User, (user) => user.order)
  user: User;
}

export async function searchingPayment(imp_uid: any) {
  const getPaymentDataURL = `https://api.iamport.kr/payments/${imp_uid}`;

  const getPaymentData = await axios({
    url: getPaymentDataURL,
    method: "get",
    headers: {
      Authorization: await getToken(),
    },
  });
  return getPaymentData;
}
