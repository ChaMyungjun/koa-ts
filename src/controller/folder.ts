/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { getManager, Repository } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, responsesAll, tagsAll } from "koa-swagger-decorator";
import { Token } from "../entity/token";
import { User } from "../entity/user";
import { Folder } from "../entity/folder";
import { Music } from "../entity/music";
import { folder } from ".";

@responsesAll({
  200: { descriptoin: "success" },
  400: { description: "bad requset" },
  401: { descriptoin: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["Folder"])
export default class FolderController {
  @request("post", "/folder/create")
  @summary("create folder")
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

    // console.log(ctx.request);

    const gottenToken = ctx.request.header.token;
    const folderData = ctx.request.body.product;
    const memoData = ctx.request.body.memo;

    // console.log("folderData", folderData);

    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    if (findUser) {
      // console.log("findUser: ", findUser);
      const title = ctx.request.body.title;

      if (folderData) {
        await Promise.all(
          folderData.map(async (cur: any, index: any) => {
            const foldData: any = {
              id: null,
              title: title,
              image: null,
              name: null,
              genre: null,
              audioURL: null,
              artist: null,
              memo: null,
            };

            //music data
            const getMusicData: any = await MusicRepository.findOne({
              index: cur.id,
            });

            // console.log(getMusicData);
            console.log(getMusicData);

            foldData.id = cur.id;
            foldData.image = getMusicData.image;
            foldData.name = getMusicData.name;
            foldData.audioURL = getMusicData.audioUrl;
            foldData.artist = getMusicData.artist;
            foldData.memo = memoData;

            console.log("foldData: ", foldData);

            //error checking
            const errors: ValidationError[] = await validate(foldData);

            if (errors.length > 0) {
              ctx.status = 400;
              ctx.body = errors;
            } else if (await FolderReposiotry.findOne({ id: foldData.id })) {
              // const users = await UserRepository.find({
              //   relations: ["folder"],
              // });

              // console.log(users);

              ctx.status = 400;
              ctx.body = { error: "이미 추가된 음악입니다." };
            } else {
              const folder = await FolderReposiotry.save(foldData);
              const user = await UserRepository.update(findUser.index, {
                folder: folder,
              });
              console.log(user);
              // console.log(folder);
              ctx.status = 200;
              ctx.body = { user };
            }
          })
        );
        return;
      }
      console.log("product doesn't exits");

      const folder = await FolderReposiotry.save(title);
      const user = await UserRepository.update(findUser.index, {
        folder: folder,
      });

      console.log({ folder, user });

      ctx.status = 200;
      ctx.body = { message: "folder create but not music item" };
    } else {
      ctx.status = 403;
      ctx.body = { message: "token doesn't exist" };
    }
  }

  @request("post", "/folder/delete")
  @summary("delete folder")
  public static async deleteFolder(ctx: BaseContext): Promise<void> {
    const UserRepository: Repository<User> = getManager().getRepository(User);

    const user = await UserRepository.find({ relations: ["folder"] });
    ctx.status = 200;
    ctx.body = user;
  }
}
