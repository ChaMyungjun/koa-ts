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
import { Order, searchingPayment } from "../entity/order";
import { Music } from "../entity/music";

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
      console.log(date);

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
      memberToBeSaved.membershipType =
        ctx.request.body.membershipType === "1"
          ? "business"
          : ctx.request.body.membershipType === "2"
          ? "enterprise"
          : "free";

      // memberToBeSaved.pay =
      memberToBeSaved.amount =
        ctx.request.body.membershipType === "1" ? 30000 : null;

      memberToBeSaved.merchantUid = meruuid_member;

      //errors
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

        await issueBilling(
          paymentToBeSaved.customerUid,
          await getToken(),
          ctx.request.body.cardNum,
          "20" + ctx.request.body.expire,
          ctx.request.body.birth,
          ctx.request.body.password,
          paymentToBeSaved.merchantUid,
          memberToBeSaved.amount
        ).then(async (res: any) => {
          console.log(res.firstPay);
          //scheduled
          await bookedPayment(
            res.firstPay.response.customer_uid,
            memberToBeSaved.merchantUid,
            memberToBeSaved.amount,
            memberToBeSaved.membershipType,
            await memberRepository.find()
          ).then((res) => {
            console.log(res.data);
            memberToBeSaved.merchantUid = res.data.response[0].merchant_uid;
            memberToBeSaved.scheduledAt = new Date();
          });
        });

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

        await issueBilling(
          paymentToBeSaved.customerUid,
          await getToken(),
          ctx.request.body.cardNum,
          "20" + ctx.request.body.expire,
          ctx.request.body.birth,
          ctx.request.body.password,
          paymentToBeSaved.merchantUid,
          memberToBeSaved.amount
        ).then(async (res: any) => {
          console.log(res.firstPay);
          //scheduled
          await bookedPayment(
            res.firstPay.response.customer_uid,
            memberToBeSaved.merchantUid,
            memberToBeSaved.amount,
            memberToBeSaved.membershipType,
            await memberRepository.find()
          ).then((res) => {
            console.log(res.data);
            memberToBeSaved.merchantUid = res.data.response[0].merchant_uid;
            memberToBeSaved.scheduledAt = new Date();
          });
        });

        await memberRepository.save(memberToBeSaved);
        await paymentRepository.save(paymentToBeSaved);
        await userRepository.update(userToBeUpdate.index, {
          payment: paymentToBeSaved,
          member: memberToBeSaved,
        });
        ctx.status = 200;
      } else {
        //pay
        await issueBilling(
          paymentToBeSaved.customerUid,
          await getToken(),
          ctx.request.body.cardNum,
          "20" + ctx.request.body.expire,
          ctx.request.body.birth,
          ctx.request.body.password,
          paymentToBeSaved.merchantUid,
          memberToBeSaved.amount
        ).then(async (res: any) => {
          console.log(res.firstPay);
          //scheduled
          await bookedPayment(
            res.firstPay.response.customer_uid,
            memberToBeSaved.merchantUid,
            memberToBeSaved.amount,
            memberToBeSaved.membershipType,
            await memberRepository.find()
          ).then((res) => {
            console.log(res.data);
            memberToBeSaved.merchantUid = res.data.response[0].merchant_uid;
            memberToBeSaved.scheduledAt = new Date();
            // memberToBeSaved.scheduledAt = res.data.response[0].schedule_at;
          });
        });

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

  @request("post", "/payment/order")
  @summary("normal payment")
  public static async craeteOrder(ctx: BaseContext): Promise<void> {
    console.log(ctx.request.body);
    // const paymentRepository: Repository<Payment> = getManager().getRepository(
    //   Payment
    // );
    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const userRepository: Repository<User> = getManager().getRepository(User);
    const orderRepository: Repository<Order> = getManager().getRepository(
      Order
    );
    const musicRepository: Repository<Music> = getManager().getRepository(
      Music
    );

    const orderToBeSaved: Order = new Order();

    const meruuid = await meruuid4();

    const gottenToken = ctx.request.body.token;
    const gottenProduct = ctx.request.body.product;

    const findUser = await userRepository.findOne({
      token: await tokenRepository.findOne({ token: gottenToken }),
    });

    let title: any = null;
    let price: any = null;

    gottenProduct.map((cur: any, index: any) => {
      title += cur.name;
      price += cur.price;
    });

    console.log(title, price);

    if (findUser) {
      const data = {
        member: "normalPayment",
        merchant_uid: meruuid,
        product: {
          title: title,
        },
        price: price,
        user: {
          name: findUser.name,
          email: findUser.email,
        },
      };

      orderToBeSaved.member = data.member;
      orderToBeSaved.merchantUid = data.merchant_uid;
      orderToBeSaved.amount = data.price;
      orderToBeSaved.name = data.user.name;
      orderToBeSaved.email = data.user.email;
      orderToBeSaved.orderTitle = data.product.title;
      orderToBeSaved.status = "결제대기";

      await orderRepository.save(orderToBeSaved);

      ctx.status = 200;
      ctx.body = { data };
    } else {
      console.log(ctx.request.body.token);
      ctx.status = 403;
      ctx.body = { error: "token doesn't found" };
    }

    /**
 * 
            merchant_uid: order.merchant_uid, // 주문번호
            amount: order.price, // 결제금액
            name: order.product.title, // 주문명
            buyer_name: order.user.email, // 구매자 이름
            buyer_email: order.user.email, // 구매자 이메일
 * 
 * 
 */
  }

  @request("post", "/payment/order/callback")
  @summary("normal payment callback")
  public static async normalPaymentCallback(ctx: BaseContext): Promise<void> {
    const data = ctx.request.body;
    console.log(data);
    const orderRepository: Repository<Order> = getManager().getRepository(
      Order
    );

    const getPaymentData: any = await searchingPayment(data.merchant_uid);
    console.log(getPaymentData);
    const paymentData = getPaymentData.data.response.list[0];
    const findOrder = await orderRepository.findOne({
      merchantUid: paymentData.merchant_uid,
    });
    console.log(paymentData);
    console.log(findOrder);

    const { amount, status }: any = paymentData;

    if (amount === findOrder.amount) {
      switch (status) {
        case "ready":
          ctx.status = 400;
          ctx.body = { err: "method is not supported" };
          break;
        case "paid":
          await orderRepository.update(findOrder.index, {
            status: "결제 성공",
          });

          ctx.status = 200;
          ctx.body = { message: "normal payment success" };
          break;
        default:
          await orderRepository.update(findOrder.index, {
            status: "결제 실패",
          });
          break;
      }
    } else {
      ctx.status = 400;
      ctx.body = { error: "amount is forgery" };
    }
  }

  @request("post", "/payment/callback")
  @summary("payment User Product")
  public static async callbackPayment(ctx: BaseContext): Promise<void> {
    const memberRepository: Repository<Member> = await getManager().getRepository(
      Member
    );
    const orderRepository: Repository<Order> = await getManager().getRepository(
      Order
    );

    const orderToBeSaved: Order = new Order();

    const { imp_uid, merchant_uid } = ctx.request.body;
    const access_token = await getToken();

    const paymentSearchingURL = `https://api.iamport.kr/payments/${imp_uid}`;
    try {
      const getPaymentData: any = await axios({
        url: paymentSearchingURL,
        method: "GET",
        headers: { Authorization: access_token },
      });

      const paymentData = getPaymentData.data.response;
      const { status, merchant_uid } = paymentData;
      //console.log(paymentData);
      const meruuid = await meruuid4();

      const findMember = await memberRepository.findOne({
        merchantUid: merchant_uid,
      });
      const findOrder = await orderRepository.findOne({
        merchantUid: merchant_uid,
      });

      if (status === "paid") {
        //merchant_uid compare => scheduled or normal

        //scheduled payment
        if (findMember) {
          console.log(findMember);

          //console.log(paymentData.merchant_uid);

          let resposneBookedData: any = null;

          //payment value saving
          orderToBeSaved.orderTitle = paymentData.name;
          orderToBeSaved.member = "membership scheduled payment";
          orderToBeSaved.name = paymentData.buyer_name;
          orderToBeSaved.email = paymentData.buyer_email;
          orderToBeSaved.merchantUid = paymentData.merchant_uid;
          orderToBeSaved.status = paymentData.status;
          orderToBeSaved.method = paymentData.pay_method;
          orderToBeSaved.failedReason = paymentData.fail_reason;
          orderToBeSaved.amount = paymentData.amount;

          //membership scheduled db update
          await memberRepository.update(findMember.index, {
            status: paymentData.status === "paid" ? "결제완료" : "결제실패",
            method: paymentData.pay_method,
            failedReason: paymentData.fail_reason,
          });

          //saving scheduled payment
          await orderRepository.save(orderToBeSaved);

          //scheduled
          await await bookedPayment(
            paymentData.customer_uid,
            meruuid,
            paymentData.amount,
            paymentData.name,
            await memberRepository.find()
          ).then(async (res) => {
            resposneBookedData = res;

            console.log(meruuid);
            console.log(resposneBookedData.data);

            const findMember = await memberRepository.findOne({
              merchantUid: res.data.response[0].merchant_uid,
              scheduledAt: new Date(),
            });

            console.log(findMember);

            ctx.status = 200;
            ctx.body = { message: "schduled is succeed" };
          });
          // memberToBeSaved.status = paymentData.status;
          // memberToBeSaved.method = paymentData.pay_method;
          // memberToBeSaved.failedReason = paymentData.fail_resason;

          //normal payment
        } else if (findOrder) {
          console.log(paymentData);

          //payment value saving
          orderToBeSaved.orderTitle = paymentData.name;
          orderToBeSaved.member = "normal payment";
          orderToBeSaved.name = paymentData.buyer_name;
          orderToBeSaved.email = paymentData.buyer_email;
          orderToBeSaved.merchantUid = paymentData.merchant_uid;
          orderToBeSaved.status = paymentData.status;
          orderToBeSaved.method = paymentData.pay_method;
          orderToBeSaved.failedReason = paymentData.fail_reason;
          orderToBeSaved.amount = paymentData.amount;

          //saving scheduled payment
          await orderRepository.save(orderToBeSaved);

          ctx.status = 200;
          ctx.body = { message: "paid is succeed" };

          //not noram & payment
        } else {
          console.log(paymentData.merchant_uid);
          ctx.status = 400;
          ctx.body = status;
        }

        //payment failed
      } else {
        ctx.status = 400;
        ctx.body = status;
      }
    } catch (err) {
      console.error("Error: ", err);
      ctx.status = 400;
      ctx.body = err;
    }
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
