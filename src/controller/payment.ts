/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { request, responsesAll, summary } from "koa-swagger-decorator";
import { getManager, Repository, Equal, Not, createConnection } from "typeorm";
import { IsEmail, validate, ValidationError } from "class-validator";

import { User } from "../entity/user";

import {
  Payment,
  uuidv4,
  getToken,
  issueBilling,
  normalPayment,
  bookedPayment,
} from "../entity/payment";
import { ConsoleTransportOptions } from "winston/lib/winston/transports";
import { Token, decoded } from "../entity/token";
import { payment } from ".";

@responsesAll(["Payment"])
export default class PaymentController {
  @request("post", "/payment/create")
  @summary("create payment info")
  public static async createPaymentInfo(ctx: BaseContext): Promise<void> {
    //get a payment to perform operations with paymenrt
    const paymentRepository: Repository<Payment> = await getManager().getRepository(
      Payment
    );
    const userRepository: Repository<User> = await getManager().getRepository(
      User
    );
    const tokenRepository: Repository<Token> = await getManager().getRepository(
      Token
    );

    const gottenToken = ctx.cookies.get("access_token");

    console.log(ctx.request.body);

    console.log(
      "user token value: ",
      await userRepository.find({ relations: ["token"] })
    );
    console.log(
      "token value: ",
      await tokenRepository.findOne({ token: gottenToken })
    );

    const userToBeUpdate = await userRepository.findOne({
      token: await tokenRepository.findOne({ token: gottenToken }),
    });

    if (userToBeUpdate) {
      console.log("pass");
      //craete random customer uuid
      const uuid = uuidv4();

      //create entity
      //build up entity payment info to be saved
      const paymentToBeSaved: Payment = new Payment();

      //validate payment entity
      const errorsPayment: ValidationError[] = await validate(paymentToBeSaved);

      paymentToBeSaved.cardNumber = ctx.request.body.cardNum;
      paymentToBeSaved.cardExpire = ctx.request.body.expire;
      paymentToBeSaved.birth = ctx.request.body.birth;
      paymentToBeSaved.cardPassword2digit = ctx.request.body.password;
      paymentToBeSaved.cardType =
        ctx.request.body.cardType === 1 ? "개인카드" : "법인카드";
      paymentToBeSaved.companyCardType =
        ctx.request.companycardtype === 1 ? "개인법인카드" : "회사법인카드";
      paymentToBeSaved.customerUid = uuid;

      // generate billing key

      await issueBilling(
        paymentToBeSaved.customerUid,
        await getToken(),
        paymentToBeSaved.cardNumber,
        paymentToBeSaved.cardExpire,
        paymentToBeSaved.birth,
        paymentToBeSaved.cardPassword2digit
      );

      if (errorsPayment.length > 0) {
        //error checking
        ctx.status = 400;
        ctx.body = errorsPayment;
      } else if (
        await paymentRepository.findOne({
          cardNumber: paymentToBeSaved.cardNumber,
        })
      ) {
        ctx.status = 400;
        ctx.body = "CardNumber already exists";
      } else if (
        await paymentRepository.findOne({ birth: paymentToBeSaved.birth })
      ) {
        ctx.status = 400;
        ctx.body = "Brith already exist";
      } else {
        const payment = await paymentRepository.save(paymentToBeSaved);
        const user = await userRepository.update(userToBeUpdate.index, {
          payment: paymentToBeSaved,
        });
        console.log({ payment, user });

        ctx.status = 201;
      }
    } else {
      ctx.status = 403;
      ctx.body = "Token Expired";
    }
  }

  @request("post", "/payment/pay")
  @summary("payment User Product")
  public static async createOrder(ctx: BaseContext): Promise<void> {
    // const UserPayment = IamportPayment();
    // console.log(UserPayment);
    console.log("Payment");
  }

  @request("post", "/payment/normalpayment")
  @summary("normal payment")
  public static async normalPayment(ctx: BaseContext): Promise<void> {
    const normalPaymentRepository: Repository<Payment> = getManager().getRepository(
      Payment
    );
    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const userRepository: Repository<User> = getManager().getRepository(User);

    //console.log(await userRepository.find({ relations: ["payment"] }));
    console.log(await userRepository.find({ relations: ["company"] }));

    // let userCustomerUid: any = null

    // normalPayments.map((cur, index) => {
    //   userCustomerUid = cur.customerUid;
    // });

    // normal payment required value
    // console.log(
    //   await normalPayment(
    //     await getToken(),
    //     userCustomerUid,
    //     "order_monthly_0001",
    //     200,
    //     "일반결제 테스트"
    //   )
    // );
  }

  @request("post", "/payment/booked")
  @summary("booked payment")
  public static async bookedPayment(ctx: BaseContext): Promise<void> {
    const bookedPaymentRepository: Repository<Payment> = getManager().getRepository(
      Payment
    );

    let userCustomerUid: any = null;

    const bookedPayments: Payment[] = await bookedPaymentRepository.find();

    bookedPayments.map((cur, index) => {
      userCustomerUid = cur.customerUid;
    });

    // console.log(
    //   await bookedPayment(
    //     userCustomerUid,
    //     "order_monthly_0001",
    //     200,
    //     "월간 이용권 정기 결제 테스팅"
    //   )
    // );
  }
}
