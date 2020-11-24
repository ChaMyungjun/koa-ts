/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { request, responsesAll, summary } from "koa-swagger-decorator";

import { IamportPayment } from "../lib/payment";

import { Payment, uuidv4, getToken, issueBilling } from "../entity/payment";
import { getManager, Repository } from "typeorm";
import { validate, ValidationError } from "class-validator";

@responsesAll(["Payment"])
export default class PaymentController {
  @request("post", "/payment/pay")
  @summary("payment User Product")
  public static async createOrder(ctx: BaseContext): Promise<void> {
    const UserPayment = IamportPayment();
    console.log(UserPayment);
  }

  @request("post", "/payment/create")
  @summary("create payment info")
  public static async createPaymentInfo(ctx: BaseContext): Promise<void> {
    //get a payment to perform operations with paymenrt
    const paymentRepository: Repository<Payment> = getManager().getRepository(
      Payment
    );

    //craete random customer uuid
    const uuid = uuidv4();

    //create entity
    //build up entity payment info to be saved
    const paymentToBeSaved: Payment = new Payment();

    //v alidate payment entity
    const errors: ValidationError[] = await validate(paymentToBeSaved);

    paymentToBeSaved.cardNumber = ctx.request.body.cardNumber;
    paymentToBeSaved.cardExpire = ctx.request.body.cardExpire;
    paymentToBeSaved.birth = ctx.request.body.birth;
    paymentToBeSaved.cardPassword2digit = ctx.request.body.cardPassword2digit;
    paymentToBeSaved.customerUid = uuid;
    
    //showing biling key
    console.log(
      await issueBilling(
        paymentToBeSaved.customerUid,
        await getToken(),
        paymentToBeSaved.cardNumber,
        paymentToBeSaved.cardExpire,
        paymentToBeSaved.birth,
        paymentToBeSaved.cardPassword2digit
      )
    );

    if (errors.length > 0) {
      ctx.status = 400;
      ctx.body = errors;
    } else if (await paymentRepository.find({ relations: ["user"] })) {
      ctx.status = 400;
      ctx.body = "User already has card info data";
    } else {
      const payment = await paymentRepository.save(paymentToBeSaved);
      ctx.status = 201;
      ctx.body = payment;
    }
  }
}
