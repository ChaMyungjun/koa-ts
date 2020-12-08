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
    const memoData = ctx.request.body.memo;
    console.log(folderData);

    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    if (findUser) {
      const folderToBeSaved: Folder = new Folder();

      folderToBeSaved.title = ctx.request.body.title;

      if (folderData) {
        folderData.map(async (cur: any, index: any) => {
          const foldData: any = {
            id: null,
            image: null,
            name: null,
            genre: null,
            audioURL: null,
            artist: null,
            memo: null,
          };

          //music data
          const getMusicData = await MusicRepository.findOne({ index: cur.id });

          foldData.id = getMusicData.index;
          foldData.image = getMusicData.image;
          foldData.name = getMusicData.name;
          foldData.audioURL = getMusicData.audioUrl;
          foldData.artist = getMusicData.artist;
          foldData.memo = memoData;

          const errors: ValidationError[] = await validate(folderToBeSaved);

          if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
          } else if (await FolderReposiotry.findOne({ id: foldData.id })) {
            ctx.status = 400;
            ctx.body = { error: "item already exists" };
          } else {
            const folder = await FolderReposiotry.save(folderData);
            console.log(folder);
            ctx.status = 201;
            ctx.body = { message: "folder create success" };
          }
        });
      } else {
        console.log("product doesn't exits");
      }
    } else {
      ctx.status = 403;
      ctx.body = { message: "token doesn't exist" };
    }
  }
}
