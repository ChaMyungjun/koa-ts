import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Admin extends BaseEntity {
  @PrimaryGeneratedColumn()
  index: number;

  //name
  @Column({
    nullable: true,
  })
  name: string;

  //email
  @Column()
  email: string;

  //password
  @Column({
    nullable: true,
  })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export const adminSchema = {
  id: { type: "number", required: true, example: 1 },
  name: { type: "string", required: false, example: "Javier" },
  email: {
    type: "string",
    required: true,
    example: "avileslopezjavier@gmail.com",
  },
  password: {
    type: "string",
    required: false,
  },
};
