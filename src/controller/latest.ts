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

    const gottenToken = ctx.request.header.authorization.split(" ")[1];
    const musiclatestData = ctx.request.body.product;

    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    const latestToBeSaved: Latest = new Latest();

    if (findUser) {
      console.log(findUser);

      if (musiclatestData) {
        await Promise.all(
          musiclatestData.map(async (cur: any, index: any) => {
            const getMusicData: any = await musicRepository.findOne({
              id: cur.id,
            });

            latestToBeSaved.user = findUser;
            latestToBeSaved.music = [getMusicData];

            const errors: ValidationError[] = await validate(latestToBeSaved);

            const findlatestUser = await latestRepository.find({
              user: latestToBeSaved.user,
            });

            if (errors.length > 0) {
              console.log("Error: ", errors);
              ctx.status = 400;
              ctx.body = errors;
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

              const latestRemoved = await latestRepository.remove(
                latestToBeRemoved
              );

              console.log(latestRemoved);

              const latest = await latestRepository.save(latestToBeSaved);

              console.log(latest);

              ctx.status = 201;
              ctx.body = {
                message: "길이를 초과하여 마지막 음악을 삭제하였습니다.",
              };
            } else {
              const latest = await latestRepository.save(latestToBeSaved);

              ctx.status = 200;
              ctx.body = { message: "latest list saving success" };
            }
          })
        );
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
}
