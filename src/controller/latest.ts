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

    const gottenToken = ctx.request.header.token;
    const musiclatestData = ctx.request.body.product;

    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    const findLatestMusic = await latestRepository.findOne({
      name: findUser.name,
    });

    if (findUser) {
      if (musiclatestData) {
        await Promise.all(
          musiclatestData.map(async (cur: any, index: any) => {
            const latestData: any = {
              id: null,
              name: null,
              image: null,
              artiest: null,
              genre: null,
              audioUrl: null,
              username: null,
            };

            const getMusicData: any = await musicRepository.findOne({
              index: cur.id,
            });

            latestData.id = cur.id;
            latestData.name = getMusicData.name;
            latestData.image = getMusicData.image;
            latestData.artiest = getMusicData.artiest;
            latestData.genre = getMusicData.genre;
            latestData.audioUrl = getMusicData.audioUrl;
            latestData.username = findUser.name;

            const errors: ValidationError[] = await validate(latestData);

            if (errors.length > 0) {
              ctx.status = 400;
              ctx.body = errors;
            } else if (Math.max(findLatestMusic.index) > 30) {
              const latestToBeRemoved = await latestRepository.findOne({
                index: Math.min(findLatestMusic.index),
              });

              const latestRemoved = await latestRepository.remove(
                latestToBeRemoved
              );

              const latest = await latestRepository.save(latestData);
              console.log(latest);

              ctx.status = 201;
              ctx.body = {
                message: "길이를 초과하여 마지막 음악을 삭제하였습니다.",
              };
            } else {
              const latest = await latestRepository.save(latestData);
              const user = await UserRepository.update(findUser.index, {
                latest: latest,
              });

              ctx.status = 200;
              ctx.body = { message: "latest list saving success" };
            }
          })
        );
      } else {
        return;
      }
    } else {
      ctx.status = 400;
      ctx.body = { error: "token doesn't exists" };
    }
  }
}
