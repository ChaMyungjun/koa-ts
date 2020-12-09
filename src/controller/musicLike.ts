/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/type-annotation-spacing */
import { BaseContext } from "koa";
import { request, responsesAll, summary, tagsAll } from "koa-swagger-decorator";
import { ReplOptions } from "repl";
import { User } from "../entity/user";
import { getManager, Repository } from "typeorm";
import { Token } from "../entity/token";
import { MusicLike } from "../entity/musicLike";
import { Music } from "../entity/music";
import { music } from ".";
import { validate, ValidationError } from "class-validator";

@responsesAll({
  200: { descriptoin: "success" },
  400: { description: "bad requset" },
  401: { descriptoin: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["MusicLike"])
export default class MusicLikeController {
  @request("post", "/musiclike/create")
  @summary("create music like")
  public static async createMusicLike(ctx: BaseContext): Promise<void> {
    const UserRepository: Repository<User> = getManager().getRepository(User);
    const TokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const MusicLikeRepository: Repository<MusicLike> = getManager().getRepository(
      MusicLike
    );
    const MusicRepository: Repository<Music> = getManager().getRepository(
      Music
    );

    const gottenToken = ctx.request.header.token;
    const musicLikeData = ctx.request.body.product;
    const likeData = ctx.request.body.like;

    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    if (findUser) {
      if (musicLikeData) {
        await Promise.all(
          musicLikeData.map(async (cur: any, index: any) => {
            const musicData: any = {
              id: null,
              image: null,
              name: null,
              genre: null,
              audioUrl: null,
              artist: null,
              like: null,
            };

            const getMusicData: any = await MusicRepository.findOne({
              index: cur.id,
            });

            console.log(getMusicData);

            musicData.id = cur.id;
            musicData.image = getMusicData.image;
            musicData.name = getMusicData.name;
            musicData.genre = getMusicData.genre;
            musicData.audioUrl = getMusicData.audioUrl;
            musicData.artist = getMusicData.artist;
            musicData.like = !likeData;

            const errors: ValidationError[] = await validate(musicData);

            if (errors.length > 0) {
              ctx.status = 400;
              ctx.body = errors;
            } else {
              const musicLike = await MusicLikeRepository.save(musicData);
              const user = await UserRepository.update(findUser.index, {
                musiclike: musicLike,
              });

              console.log({ musicLike, user });

              ctx.status = 200;
              ctx.body = { message: "create music like success" };
            }
          })
        );
      } else {
        console.log("product doesn't exists");
        ctx.status = 400;
        ctx.body = { error: "product doesn't exists" };
      }
    } else {
      ctx.status = 403;
      ctx.body = { error: "token doesn't exists" };
    }
  }
}
