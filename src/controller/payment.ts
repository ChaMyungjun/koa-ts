/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { request, responsesAll, summary } from "koa-swagger-decorator";
import { getManager, Repository, Equal, Not, createConnection } from "typeorm";
import { IsEmail, validate, ValidationError } from "class-validator";
import axios from "axios";

import { User } from "../entity/user";
import { Member, meruuid4, bookedPayment } from "../entity/member";

import {
  Payment,
  uuidv4,
  getToken,
  issueBilling,
  normalPayment,
} from "../entity/payment";
import { Token, decoded } from "../entity/token";

@responsesAll(["Payment"])
export default class PaymentController {
  @request("post", "/payment/meber/craete")
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
    const memberRepository: Repository<Member> = await getManager().getRepository(
      Member
    );

    const gottenToken = ctx.request.body.token;

    // console.log(ctx.request.body);

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

    console.log(gottenToken);

    const howMatch = await memberRepository.find();

    if (userToBeUpdate) {
      console.log(userToBeUpdate);
      //craete random customer uuid
      const uuid = await uuidv4();
      const meruuid = await meruuid4();

      console.log(uuid, meruuid);

      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      date.setHours(9);

      //create entity
      //build up entity payment info to be saved
      const paymentToBeSaved: Payment = new Payment();
      const memberToBeSaved: Member = new Member();

      //validate payment entity
      const errorsPayment: ValidationError[] = await validate(paymentToBeSaved);

      paymentToBeSaved.cardNumber = ctx.request.body.cardNum.slice(-4);
      paymentToBeSaved.cardType =
        ctx.request.body.type === 1 ? "법인카드" : "개인카드";
      paymentToBeSaved.corporationType =
        ctx.request.body.CorporationType === 1
          ? "개인법인카드"
          : "공용법인카드";
      paymentToBeSaved.customerUid = uuid;

      memberToBeSaved.member =
        ctx.request.body.membershipType === 0
          ? "free"
          : ctx.request.body.membershipType === 1
          ? "business"
          : "enterprise";
      memberToBeSaved.merchantUid = meruuid;
      // memberToBeSaved.pay =
      memberToBeSaved.amount =
        ctx.request.body.membershipType === 0 ? 30000 : null;

      memberToBeSaved.scheduledAt = date;

      await issueBilling(
        paymentToBeSaved.customerUid,
        await getToken(),
        ctx.request.body.cardNum,
        ctx.request.body.expire,
        ctx.request.body.birth,
        ctx.request.body.password
      ).then(async (res) => {
        //console.log(res);
        await bookedPayment(
          paymentToBeSaved.customerUid,
          memberToBeSaved.merchantUid,
          200,
          "월별 예약 결제"
        ).then((res) => {
          //console.log(res);
        });
      });

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
        ctx.body = "Card already exist";
      } else if (uuid === paymentToBeSaved.customerUid) {
        const uuid: any = await uuidv4();
        paymentToBeSaved.customerUid = uuid;

        await paymentRepository.save(paymentToBeSaved);
        await userRepository.update(userToBeUpdate.index, {
          payment: paymentToBeSaved,
        });
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
      ctx.body = { error: "Token doesn't exist" };
    }
  }

  @request("post", "/payment/member/callback")
  @summary("payment User Product")
  public static async callbackPayment(ctx: BaseContext): Promise<void> {
    const { imp_uid, merchant_uid } = ctx.request.body;
    const access_token = getToken();

    const paymentDataURL = `https://api.iamport.kr/payments/${imp_uid}`;

    const getPaymentData = await axios({
      url: paymentDataURL,
      method: "get",
      headers: { Authorization: access_token },
    });

    const paymentData = getPaymentData.data.response;
    console.log(paymentData);
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

    console.log(await userRepository.find({ relations: ["payment"] }));
    console.log(await userRepository.find({ relations: ["company"] }));
    console.log(await userRepository.find({ relations: ["token"] }));

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
}

/**
 *
 *
 * personel card
 * 개인카드 : type: num, membershipType:num,cardNum: num, expire: num, password: num, birth: num
 *
 * lawer card
 * 법인카드: type: num, membershipType:num,CorporationType:num,cardNum: num, expire: num, password: num,  businessNum: num
 *
 */
