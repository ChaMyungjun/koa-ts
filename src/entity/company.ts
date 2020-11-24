/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Length, IsEmail } from "class-validator";
import { User } from "./user";

@Entity()
export class Company extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  //Compnayname
  @Column({
    length: 80,
  })
  @Length(3, 80)
  companyName: string;

  //name
  @Column({
    length: 30,
  })
  @Length(3, 20)
  name: string;

  //email
  @Column({
    length: 100,
  })
  @IsEmail()
  email: string;

  //position
  @Column({
    length: 100,
  })
  @Length(6, 100)
  position: string;

  //phone
  @Column({
    length: 30,
  })
  @Length(9, 20)
  phone: string;

  //business img
  @Column({
    length: 100,
  })
  @Length(30, 80)
  image: string;

  @OneToOne((type) => User, (user) => user.email)
  @JoinColumn()
  user!: User;
}

export const Companyschema = {
  // id: { type: "number", required: true, example: 1 },
  // name: { type: "string", required: true, example: "Javier" },
  // email: {
  //   type: "string",
  //   required: true,
  //   example: "avileslopez.javier@gmail.com",
  // },
  // password: {
  //   type: "string",
  //   required: true,
  // },
};
