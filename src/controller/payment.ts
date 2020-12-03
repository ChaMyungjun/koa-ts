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

import { Payment, uuidv4, getToken, issueBilling } from "../entity/payment";
import { Token } from "../entity/token";

@responsesAll(["Payment"])
export default class PaymentController {
  @request("post", "/payment/member/create")
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

    const userToBeUpdate = await userRepository.findOne({
      token: await tokenRepository.findOne({ token: gottenToken }),
    });

    if (userToBeUpdate) {
      //craete random customer uuid & merchant uuid
      const uuid = await uuidv4();
      const meruuid_payment = await meruuid4();
      const meruuid_member = await meruuid4();

      //date setting
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      date.setHours(9);

      //create entity
      //build up entity payment info to be saved
      const paymentToBeSaved: Payment = new Payment();
      const memberToBeSaved: Member = new Member();

      //validate payment entity
      const errorsPayment: ValidationError[] = await validate(paymentToBeSaved);

      //card register
      paymentToBeSaved.cardNumber = ctx.request.body.cardNum.slice(-4);
      paymentToBeSaved.cardType =
        ctx.request.body.type === 1 ? "법인카드" : "개인카드";
      paymentToBeSaved.corporationType =
        ctx.request.body.CorporationType === 1
          ? "개인법인카드"
          : ctx.request.body.CorporationType === null
          ? "공용법인카드"
          : null;
      paymentToBeSaved.customerUid = uuid;

      paymentToBeSaved.merchantUid = meruuid_payment;

      //membership saving
      memberToBeSaved.member =
        ctx.request.body.membershipType === 0
          ? "free"
          : ctx.request.body.membershipType === 1
          ? "business"
          : "enterprise";
      memberToBeSaved.merchantUid = meruuid_member;
      // memberToBeSaved.pay =
      memberToBeSaved.amount =
        ctx.request.body.membershipType === 0 ? 30000 : null;

      memberToBeSaved.scheduledAt = date;

      const customerUUID = paymentToBeSaved.customerUid;
      const merchatnUUID = memberToBeSaved.merchantUid;
      console.log(paymentToBeSaved.customerUid);
      console.log(customerUUID);
      console.log(memberToBeSaved.merchantUid);
      console.log(merchatnUUID);

      await issueBilling(
        customerUUID,
        await getToken(),
        ctx.request.body.cardNum,
        ctx.request.body.expire,
        ctx.request.body.birth,
        ctx.request.body.password,
        paymentToBeSaved.merchantUid
      ).then(async (res: any) => {
        console.log(res);

        await bookedPayment(
          res.response.customer_uid,
          memberToBeSaved.merchantUid,
          200,
          "월별 예약 결제"
        ).then((res) => {
          const bookedErr = res;
          console.log("Booked_Error", bookedErr);
        });
      });

      // const issuedBilling = await issueBilling(
      //   paymentToBeSaved.customerUid,
      //   ctx.request.body.cardNum,
      //   await getToken(),
      //   ctx.request.body.expire,
      //   ctx.request.body.birth,
      //   ctx.request.body.password,
      //   memberToBeSaved.merchantUid
      // );

      // console.log(issuedBilling);

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
        await memberRepository.save(memberToBeSaved);
        ctx.status = 200;
      } else if (meruuid_member === memberToBeSaved.merchantUid) {
        const meruuid = await meruuid4();
        memberToBeSaved.merchantUid = meruuid;

        await paymentRepository.save(paymentToBeSaved);
        await userRepository.update(userToBeUpdate.index, {
          payment: paymentToBeSaved,
        });
        await memberRepository.save(memberToBeSaved);
        ctx.status = 200;
      } else {
        const payment = await paymentRepository.save(paymentToBeSaved);
        const user = await userRepository.update(userToBeUpdate.index, {
          payment: paymentToBeSaved,
        });
        const member = await memberRepository.save(memberToBeSaved);

        console.log({ payment, user, member });

        ctx.status = 200;
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
