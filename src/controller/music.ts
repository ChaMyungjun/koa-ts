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
import { music, user } from ".";
import { serialize } from "v8";
import { find, findIndex, where } from "underscore";

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

  @request("post", "/music/like/save")
  @summary("testing")
  public static async musicLikeCreate(ctx: BaseContext): Promise<void> {
    const musicRepository: Repository<Music> = await getManager().getRepository(
      Music
    );
    const userRepository: Repository<User> = await getManager().getRepository(
      User
    );
    const tokenRepository: Repository<Token> = await getManager().getRepository(
      Token
    );

    const gottenToken = ctx.request.header.authorization.split(" ")[1];

    const findUser = await userRepository.findOne({
      token: await tokenRepository.findOne({ token: gottenToken }),
    });

    console.log(findUser);

    if (findUser) {
      const getMusicData = await musicRepository.findOne({
        id: ctx.request.body.music_id,
      });

      // console.log(getMusicData);

      // console.log(await musicRepository.find({ where: { user: findUser } }));

      const musicUserData = await musicRepository.find({
        relations: ["user"],
        where: { id: getMusicData.id },
      });

      // console.log(musicUserData);

      musicUserData.map(async (cur, index) => {
        // console.log("dfdffdfd", cur.user[index]);

        // if (cur.user[index]?.index === findUser.index ) {
        //   console.log("delete");
        // } else {
        //   console.log("add");
        // }

        if (cur.user[index]?.index === findUser.index) {
          // 유저의 뮤직 릴레이션 제거
          getMusicData.user = [];
          await musicRepository.save(getMusicData);

          console.log("삭제relation delete", getMusicData);

          ctx.status = 204;
          ctx.body = "유저의 뮤직 릴레이션 삭제";
          //undefined
        } else {
          // 유저에 뮤직 릴레이션 추가
          getMusicData.user = [findUser];
          await musicRepository.save(getMusicData);

          console.log("추가getMusicData", getMusicData);

          ctx.body = 201;
          ctx.body = "유저의 뮤직 릴레이션 추가";
        }
      });
    } else {
      ctx.status = 403;
      ctx.body = { error: "token doesn't exists" };
    }
  }
}
