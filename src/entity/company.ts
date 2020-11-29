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
import { Length, IsEmail } from "class-validator";
import { User } from "./user";

@Entity()
export class Company extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  //Compnayname
  @Column({ nullable: true })
  companyName: string;

  //name
  @Column()
  name: string;

  //email
  @Column()
  @IsEmail()
  email: string;

  //position
  @Column()
  position: string;

  //phone
  @Column()
  phone: string;

  //business img
  @Column()
  image: string;

  //create Date
  @CreateDateColumn()
  createdAt: Date;

  @OneToOne((type) => User, (user) => user.company)
  user: User;
}

export const Companyschema = {
  id: { type: "number", required: true, example: 1 },
  name: { type: "string", required: true, example: "Javier" },
  email: {
    type: "string",
    required: true,
    example: "avileslopez.javier@gmail.com",
  },
  password: {
    type: "string",
    required: true,
  },
};
