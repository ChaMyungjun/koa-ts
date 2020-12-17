/* eslint-disable prefer-const */
/* eslint-disable prefer-spread */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { request, responsesAll, summary, tagsAll } from "koa-swagger-decorator";
import { getManager, Repository } from "typeorm";

import { Latest } from "../entity/latest";
import { Music } from "../entity/music";
import { User } from "../entity/user";
import { Token } from "../entity/token";
import { validate, ValidationError } from "class-validator";
import { music } from ".";
import { map } from "underscore";
import { createInflate } from "zlib";

@responsesAll({
  200: { description: "success" },
  400: { description: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
  403: { description: "" },
})
@tagsAll(["music latest"])
export default class LatestController {
  @request("post", "/music/latest")
  @summary("saving user latest muic list")
  public static async saveLatestMusic(ctx: BaseContext): Promise<void> {
    const latestRepository: Repository<Latest> = await getManager().getRepository(
      Latest
    );
    const musicRepository: Repository<Music> = await getManager().getRepository(
      Music
    );
    const UserRepository: Repository<User> = await getManager().getRepository(
      User
    );
    const TokenRepository: Repository<Token> = await getManager().getRepository(
      Token
    );

    console.log("request", ctx.request.body);

    const gottenToken = ctx.request.header.authorization?.split(" ")[1];
    const musiclatestData = ctx.request.body.music_id;
    const findUser = await UserRepository.find({
      relations: ["token"],
      where: { token: await TokenRepository.findOne({ token: gottenToken }) },
    });

    if (!ctx.request.header.authorization?.split(" ")[1]) {
      ctx.status = 100;
      ctx.body = { message: "회원이 아닙니다" };
    }

    if (findUser) {
      console.log(findUser);

      const latestToBeSaved: Latest = new Latest();

      const getMusicData: any = await musicRepository.findOne({
        id: musiclatestData,
      });

      latestToBeSaved.user = findUser[0];
      latestToBeSaved.music = getMusicData;

      const errors: ValidationError[] = await validate(latestToBeSaved);

      const findlatestUser = await latestRepository.find({
        user: latestToBeSaved.user,
      });

      // console.log(latestToBeSaved.music);
      // console.log(
      //   await latestRepository.find({
      //     relations: ["music"],
      //     where: { index: musiclatestData },
      //   })
      // );

      if (errors.length > 0) {
        console.log("Error: ", errors);
        ctx.status = 400;
        ctx.body = errors;
      } else if (
        await latestRepository.findOne({
          music: latestToBeSaved.music,
          user: findUser[0],
        })
      ) {
        console.log("already exists items");

        ctx.status = 400;
        ctx.body = { message: "이미 존재하는 음악입니다" };
      } else if ((await findlatestUser.length) > 29) {
        console.log(
          "min index num",
          Math.min.apply(
            Math,
            findlatestUser.map((cur, index) => {
              return cur.index;
            })
          )
        );

        const latestToBeRemoved = await latestRepository.findOne({
          index: Math.min.apply(
            Math,
            findlatestUser.map((cur, index) => {
              return cur.index;
            })
          ),
        });

        const latestRemoved = await latestRepository.remove(latestToBeRemoved);

        console.log(latestRemoved);

        const latest = await latestRepository.save(latestToBeSaved);

        console.log("exceed length");
        console.log(latest);

        const findMusicList = await latestRepository.find({
          relations: ["music"],
          where: { user: findUser[0] },
          order: { createdAt: "ASC" },
        });

        // findMusicList.map((cur, index) => {
        //   if (cur.user === findUser) {
        //     console.log(findMusicList);

        //     let sendingData: any = [];

        //     findMusicList.map((cur, index) => {
        //       sendingData.push(cur.music);
        //     });

        //     ctx.status = 200;
        //     ctx.body = cur;
        //   } else {
        //     console.log("err");
        //   }
        // });

        ctx.status = 200;
        ctx.body = findMusicList;
      } else {
        const latest = await latestRepository.save(latestToBeSaved);

        console.log(latest);

        const findMusicList = await latestRepository.find({
          relations: ["music"],
          where: { user: findUser[0] },
          order: { createdAt: "ASC" },
        });

        // findMusicList.map((cur, index) => {
        //   console.log(cur);
        //   console.log(findUser);
        //   if (cur.user === findUser) {
        //     console.log("saving");

        //     ctx.status = 200;
        //     ctx.body = cur;
        //   } else {
        //     console.log("err");
        //   }
        // });

        ctx.status = 200;
        ctx.body = findMusicList;
      }
    } else {
      console.log("token doesn't exists");
      ctx.status = 400;
      ctx.body = { error: "token doesn't exists" };
    }
  }

  @request("get", "/music/latest/")
  @summary("latest init")
  public static async initLatestMusic(ctx: BaseContext): Promise<void> {
    const latestRepository: Repository<Latest> = await getManager().getRepository(
      Latest
    );
    const musicRepository: Repository<Music> = await getManager().getRepository(
      Music
    );
    const UserRepository: Repository<User> = await getManager().getRepository(
      User
    );
    const TokenRepository: Repository<Token> = await getManager().getRepository(
      Token
    );

    const gottenToken = ctx.request.header.authorization.split(" ")[1];
    const findUser = await UserRepository.find({
      relations: ["token"],
      where: { token: await TokenRepository.findOne({ token: gottenToken }) },
    });

    if (!ctx.request.header.authorization?.split(" ")[1]) {
      ctx.status = 100;
      ctx.body = { message: "회원이 아닙니다" };
    }

    if (findUser) {
      const initMusicData = await latestRepository.find({
        relations: ["music"],
        where: { user: findUser[0] },
        order: { createdAt: "ASC" },
      });

      let sendingData: any = [];

      // console.log(initMusicData);

      // initMusicData.map((cur, index) => {
      //   console.log(cur);
      //   // console.log(findUser);
      //   if (cur.user === findUser) {
      //     ctx.status = 200;
      //     ctx.body = cur;
      //   } else {
      //     console.log("err");
      //   }
      // });

      console.log(sendingData);

      ctx.status = 200;
      ctx.body = initMusicData;
    } else {
      ctx.status = 200;
      ctx.body = { erorr: "token doesn't exists" };
    }
  }
}
