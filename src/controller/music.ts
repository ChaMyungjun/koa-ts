/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { request, responsesAll, summary, tagsAll } from "koa-swagger-decorator";
import { getManager, Repository } from "typeorm";
import { validate, ValidationError } from "class-validator";
import axios from "axios";

import { User } from "../entity/user";
import { Member, meruuid4, bookedPayment } from "../entity/member";

import { Payment, uuidv4, getToken, issueBilling } from "../entity/payment";
import { Token } from "../entity/token";
import { Order, searchingPayment } from "../entity/order";
import { Music } from "../entity/music";

@responsesAll({
  200: { description: "success" },
  400: { description: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
  403: { description: "" },
})
@tagsAll(["Music"])
export default class MusicController {
  @request("get", "/music/find")
  @summary("getting music info")
  public static async gettingMusicInfo(ctx: BaseContext): Promise<void> {
    const musicRepository: Repository<Music> = await getManager().getRepository(
      Music
    );

    const findMusic = await musicRepository.find();
    console.log(findMusic);

    ctx.status = 200;
    ctx.body = findMusic;

    console.log("Getting Music");
  }

  // @request("post", "/music/like/save")
  // @summary("testing")
  // public static async testingMtoM(ctx: BaseContext): Promise<void> {
  //   const musicRepository: Repository<Music> = await getManager().getRepository(
  //     Music
  //   );
  //   const userRepository: Repository<User> = await getManager().getRepository(
  //     User
  //   );
  //   const tokenRepository: Repository<Token> = await getManager().getRepository(
  //     Token
  //   );

  //   const gottenToken = ctx.request.header.authorization;

  //   const findUser = await userRepository.findOne({
  //     token: await tokenRepository.findOne({ token: gottenToken }),
  //   });

  //   if(findUser) {
  //     const findLikeData = await musicRepository.find();

      

  //   } else {
  //     ctx.status = 403;
  //     ctx.body = {error: "token doesn't exists"}
  //   }
  // }
}
