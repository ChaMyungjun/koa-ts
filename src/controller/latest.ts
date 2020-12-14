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

    const gottenToken = ctx.request.header.authorization.split(" ")[1];
    const musiclatestData = ctx.request.body.music_id;
    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    const latestToBeSaved: Latest = new Latest();

    if (findUser) {
      console.log(findUser);

      if (musiclatestData) {
        const getMusicData: any = await musicRepository.findOne({
          id: musiclatestData,
        });

        latestToBeSaved.user = findUser;
        latestToBeSaved.music = getMusicData;

        const errors: ValidationError[] = await validate(latestToBeSaved);

        const findlatestUser = await latestRepository.find({
          user: latestToBeSaved.user,
        });

        console.log(latestToBeSaved.music);
        console.log(
          await latestRepository.find({
            relations: ["music"],
            where: { index: musiclatestData },
          })
        );

        if (errors.length > 0) {
          console.log("Error: ", errors);
          ctx.status = 400;
          ctx.body = errors;
        } else if (
          await latestRepository.findOne({ music: latestToBeSaved.music })
        ) {
          console.log("already exists items");

          ctx.status = 400;
          ctx.body = { message: "이미 존재하는 음악입니다" };
        } else if ((await findlatestUser.length) > 3) {
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

          const latestRemoved = await latestRepository.remove(
            latestToBeRemoved
          );

          console.log(latestRemoved);

          const latest = await latestRepository.save(latestToBeSaved);

          console.log("exceed length");
          console.log(latest);

          const findMusicList = await latestRepository.find({
            relations: ["music"],
            where: { user: findUser },
            order: { createdAt: "ASC" },
          });

          let sendingData: any = [];

          findMusicList.map((cur, index) => {
            sendingData.push(cur.music);
          });

          ctx.status = 200;
          ctx.body = findMusicList;
        } else {
          const latest = await latestRepository.save(latestToBeSaved);

          const findMusicList = await latestRepository.find({
            relations: ["music"],
            where: { user: findUser },
            order: { createdAt: "ASC" },
          });

          let sendingData: any = [];

          findMusicList.map((cur, index) => {
            sendingData.push(cur.music);
          });

          console.log("saving");

          ctx.status = 200;
          ctx.body = findMusicList;
        }
      } else {
        console.log("empty data");
        return;
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
    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    if (findUser) {
      const initMusicData = await latestRepository.find({
        relations: ["music"],
        where: { user: findUser },
        order: {createdAt: "ASC"}
      });

      let sendingData: any = [];

      console.log(initMusicData);

      initMusicData.map((cur, index) => {
        console.log(cur.music);
        sendingData.push(cur.music);
      });

      ctx.status = 200;
      ctx.body = initMusicData;
    } else {
      ctx.status = 403;
      ctx.body = { erorr: "token doesn't exists" };
    }
  }
}
