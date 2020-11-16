/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { Length, IsEmail } from "class-validator";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  //name
  @Column({
    length: 80,
  })
  @Length(3, 80)
  name: string;

  //email
  @Column({
    length: 100,
  })
  @IsEmail()
  email: string;

  //password
  @Column({
    length: 100,
  })
  @Length(6, 100)
  password: string;
}

export const userSchema = {
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
