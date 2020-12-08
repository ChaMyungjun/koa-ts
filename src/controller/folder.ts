/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { getManager, Repository } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, responsesAll, tagsAll } from "koa-swagger-decorator";
import { Token } from "../entity/token";
import { User } from "../entity/user";
import { Folder } from "../entity/folder";
import { ErrorMessageBox } from "admin-bro";
import { Music } from "../entity/music";

@responsesAll({
  200: { descriptoin: "success" },
  400: { description: "bad requset" },
  401: { descriptoin: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["folder find"])
export default class FolderController {
  @request("post", "/folder/create")
  @summary("find folder find")
  public static async createFolder(ctx: BaseContext): Promise<void> {
    // console.log(ctx.request.body);
    const UserRepository: Repository<User> = getManager().getRepository(User);
    const TokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const FolderReposiotry: Repository<Folder> = getManager().getRepository(
      Folder
    );
    const MusicRepository: Repository<Music> = getManager().getRepository(
      Music
    );

    const gottenToken = ctx.request.body.token;
    const folderData = ctx.request.body.product;
    console.log(folderData);

    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    if (findUser) {
      const folderToBeSaved: Folder = new Folder();

      folderToBeSaved.title = ctx.request.body.title;

      if (folderData) {
        folderData.map(async (cur: any, index: any) => {
          const findMusic = await MusicRepository.findOne({ id: cur.id });
        });
      }

      const errors: ValidationError[] = await validate(folderToBeSaved);

      if (errors.length > 0) {
        ctx.status = 400;
        ctx.body = errors;
      } else if (
        await FolderReposiotry.findOne({ title: folderToBeSaved.title })
      ) {
        ctx.status = 400;
        ctx.body = { message: "title exists" };
      } else {
        const folder = await FolderReposiotry.save(folderToBeSaved);

        console.log({ folder });
        ctx.status = 201;
        ctx.body = { message: "folder create success" };
      }
    } else {
      ctx.status = 403;
      ctx.body = { message: "token doesn't exist" };
    }
  }
}
