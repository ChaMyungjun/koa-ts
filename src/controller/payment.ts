/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import {
  request,
  body,
  path,
  responsesAll,
  tagsAll,
  summary,
  formData,
} from "koa-swagger-decorator";

import { IamportPayment } from "../lib/payment";

import { Payment, uuidv4, issueBilling, getToken } from "../entity/payment";
import { getManager, Repository } from "typeorm";
import { company, payment, user } from ".";
import { validate, ValidationError } from "class-validator";
import { TextDecoder } from "util";

import { Token } from "../entity/token";

@responsesAll(["Payment"])
export default class PaymentController {
  @request("post", "/payment/pay")
  @summary("payment User Product")
  public static async createOrder(ctx: BaseContext): Promise<void> {
    console.log("payment");
    console.log(ctx.status);

    const UserPayment = IamportPayment();
    console.log(UserPayment);
  }

  @request("post", "/payment/create")
  @summary("create payment info")
  public static async createPaymentInfo(ctx: BaseContext): Promise<void> {
    console.log("create payment");
    console.log(ctx.status);

    //get a payment to perform operations with paymenrt
    const paymentRepository: Repository<Payment> = getManager().getRepository(
      Payment
    );

    const uuid = uuidv4();
    console.log(typeof uuid);
    console.log(uuid);
    //create entity
    //build up entity payment info to be saved
    const paymentToBeSaved: Payment = new Payment();
    paymentToBeSaved.cardNumber = ctx.request.body.cardNumber;
    paymentToBeSaved.cardExpire = ctx.request.body.cardExpire;
    paymentToBeSaved.birth = ctx.request.body.birth;
    paymentToBeSaved.cardPassword2digit = ctx.request.body.cardPassword2digit;
    paymentToBeSaved.customerUid = uuid;

    //validate payment entity
    const errors: ValidationError[] = await validate(paymentToBeSaved);

    console.log(await getToken());

    if (errors.length > 0) {
      ctx.status = 400;
      ctx.body = errors;
    } else if (
      !(await paymentRepository.findOne({
        cardNumber: paymentToBeSaved.cardNumber,
      }))
    ) {
      ctx.status = 400;
      ctx.body = "The specified cardNumber and birth already exsits";
    } else {
      const payment = await paymentRepository.save(paymentToBeSaved);

      ctx.status = 201;
      ctx.body = payment;
    }
  }
}
