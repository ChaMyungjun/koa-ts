/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { request, responsesAll, summary, tagsAll } from "koa-swagger-decorator";
import { Token } from "../entity/token";
import { User } from "../entity/user";
import { Collection } from "../entity/collection";
import { getManager, Repository } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { createContext } from "vm";

@responsesAll({
  200: { descriptoin: "success" },
  400: { descriptoin: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["Music Collection"])
export default class MusicClassController {
  @request("post", "/music/collection")
  @summary("send music collection")
  public static async sendMusicCollection(ctx: BaseContext): Promise<void> {
    const UserRepository: Repository<User> = getManager().getRepository(User);
    const TokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const CollectionRepository: Repository<Collection> = getManager().getRepository(
      Collection
    );

    const gottenToken = ctx.request.header.token;

    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    if (findUser) {
      const findCollectionData = await CollectionRepository.find();
      console.log(findCollectionData);

      const data: any = {
        likeCount: null,
      };

      const errors: ValidationError[] = await validate(data);

      if (errors.length > 0) {
        console.log(errors);

        ctx.status = 400;
        ctx.body = { errors };
      } else {
        // const collection = await CollectionRepository.update()
      }

    } else {
      ctx.status = 403;
      ctx.body = { error: "token doesn't exists" };
    }
  }
}
