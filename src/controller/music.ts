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
}
