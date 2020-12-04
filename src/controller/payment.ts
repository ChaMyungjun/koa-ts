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

    console.log(ctx.request.body);

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
        ctx.request.body.type === 1 ? "개인카드" : "법인카드";
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
        ctx.request.body.membershipType === "1"
          ? "business"
          : ctx.request.body.membershipType === "2"
          ? "enterprise"
          : "free";

      // memberToBeSaved.pay =
      memberToBeSaved.amount =
        ctx.request.body.membershipType === "1" ? 30000 : null;

      memberToBeSaved.merchantUid = meruuid_member;

      //customer uuid
      const customerUUID = paymentToBeSaved.customerUid;

      //expires custom
      const expires_in = "20" + ctx.request.body.expire;

      console.log(expires_in);

      await issueBilling(
        customerUUID,
        await getToken(),
        ctx.request.body.cardNum,
        expires_in,
        ctx.request.body.birth,
        ctx.request.body.password,
        paymentToBeSaved.merchantUid,
        memberToBeSaved.amount
      ).then(async (res: any) => {
        await bookedPayment(
          res.firstPay.response.customer_uid,
          meruuid_member,
          memberToBeSaved.amount,
          "월별 예약 결제"
        ).then((res) => {
          console.log(res.data);
          console.log(res.data.response[0].merchant_uid);
          memberToBeSaved.scheduledAt = res.data.response[0].schedule_at;
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

        await memberRepository.save(memberToBeSaved);
        await paymentRepository.save(paymentToBeSaved);
        await userRepository.update(userToBeUpdate.index, {
          payment: paymentToBeSaved,
          member: memberToBeSaved,
        });

        ctx.status = 200;
      } else if (meruuid_member === memberToBeSaved.merchantUid) {
        const meruuid = await meruuid4();
        memberToBeSaved.merchantUid = meruuid;

        await memberRepository.save(memberToBeSaved);
        await paymentRepository.save(paymentToBeSaved);
        await userRepository.update(userToBeUpdate.index, {
          payment: paymentToBeSaved,
          member: memberToBeSaved,
        });
        ctx.status = 200;
      } else {
        const payment = await paymentRepository.save(paymentToBeSaved);
        const member = await memberRepository.save(memberToBeSaved);
        const user = await userRepository.update(userToBeUpdate.index, {
          payment: paymentToBeSaved,
          member: memberToBeSaved,
        });

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
    const memberRepository: Repository<Member> = await getManager().getRepository(
      Member
    );

    const { imp_uid, merchant_uid } = ctx.request.body;
    const access_token = await getToken();

    const paymentSearchingURL = `https://api.iamport.kr/payments/${imp_uid}`;
    const paymentScheduledURL =
      "https://api.iamport.kr/subscribe/payments/schedule";
    try {
      const getPaymentData: any = await axios({
        url: paymentSearchingURL,
        method: "GET",
        headers: { Authorization: access_token },
      });

      const paymentData = getPaymentData.data.response;
      console.log(paymentData);

      if (paymentData.status === "paid") {
        // const findMember = await memberRepository.findOne({
        //   merchantUid: paymentData.merchant_uid,
        // });
        // console.log(findMember);

        console.log(await memberRepository.find());
        console.log(paymentData.merchant_uid);

        let resposneBookedData: any = null;

        //membership scheduled db update
        // await memberRepository.update(findMember.index, {
        //   status: paymentData.status,
        //   method: paymentData.pay_method,
        //   failedReason: paymentData.fail_reason,
        // });

        await bookedPayment(
          getPaymentData.customer_uid,
          getPaymentData.merchant_uid,
          getPaymentData.amount,
          getPaymentData.name
        ).then((res) => {
          resposneBookedData = res;
        });

        ctx.status = 200;
        ctx.body = { resposneBookedData };

        // memberToBeSaved.status = paymentData.status;
        // memberToBeSaved.method = paymentData.pay_method;
        // memberToBeSaved.failedReason = paymentData.fail_resason;
      } else {
        console.log("re payment trying");
      }
    } catch (err) {
      console.error("Error: ", err);
      ctx.status = 400;
      ctx.body = { err };
    }
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
