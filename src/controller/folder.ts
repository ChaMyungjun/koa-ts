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
import { folder, user } from ".";

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

    console.log(ctx.request);

    const gottenToken = ctx.request.header.authorization.split(" ")[1];
    console.log(gottenToken);
    const folderData = ctx.request.body.product;
    const memoData = ctx.request.body.memo;
    const title = ctx.request.body.title;

    // console.log("folderData", folderData);

    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    const FoldToBeSaved: Folder = new Folder();

    console.log(findUser);

    if (findUser) {
      // FoldToBeSaved.memo = memoData;
      FoldToBeSaved.title = title;
      FoldToBeSaved.user = findUser;
      // // console.log("findUser: ", findUser);
      // if (folderData) {
      //   await Promise.all(
      //     folderData.map(async (cur: any, index: any) => {
      //       //music data

      //       console.log(cur.id);
      //       const getMusicData: any = await MusicRepository.findOne({
      //         id: cur.id,
      //       });

      //       // console.log(getMusicData);
      //       console.log("Get Music Data", getMusicData);

      //       FoldToBeSaved.memo = memoData;
      //       FoldToBeSaved.title = title;
      //       FoldToBeSaved.user = findUser;
      //       FoldToBeSaved.music = getMusicData;

      //       console.log("Error");
      //       //error checking
      //       const errors: ValidationError[] = await validate(FoldToBeSaved);

      //       if (errors.length > 0) {
      //         ctx.status = 400;
      //         ctx.body = errors;
      //       } else if (
      //         await FolderReposiotry.findOne({ music: getMusicData })
      //       ) {
      //         // const users = await UserRepository.find({
      //         //   relations: ["folder"],
      //         // });

      //         // console.log(users);

      //         ctx.status = 400;
      //         ctx.body = { error: "이미 추가된 음악입니다." };
      //       } else {
      //         const folder = await FolderReposiotry.save(FoldToBeSaved);
      //         const findFolderMusicData = await FolderReposiotry.find({
      //           user: findUser,
      //         });

      //         console.log("save");

      //         // console.log(folder);
      //         ctx.status = 201;
      //       }
      //     })
      //   );
      console.log("product doesn't exits");

      const folder = await FolderReposiotry.save(FoldToBeSaved);

      console.log(folder);

      ctx.status = 200;
      ctx.body = { message: "create folder" };
    } else {
      ctx.status = 403;
      ctx.body = { error: "token doesn't exist" };
    }
  }

  @request("post", "/folder/music/add")
  @summary("add music in folder")
  public static async deleteFolder(ctx: BaseContext): Promise<void> {
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

    const gottenToken = ctx.request.header.authorization.split(" ")[1];
    const musicId = ctx.request.body.music_id;

    const findUser = await UserRepository.findOne({
      token: await TokenRepository.findOne({ token: gottenToken }),
    });

    if (findUser) {
      const getMusicData = await MusicRepository.findOne({ id: musicId });
      const findFolder = await FolderReposiotry.findOne({ user: findUser });

      console.log(findFolder);

      findFolder.music = getMusicData;
      findFolder.memo = ctx.request.body?.memo;

      if (await FolderReposiotry.findOne({ music: findFolder.music })) {
        ctx.status = 400;
        ctx.body = { error: "music already exists" };
      } else {
        await FolderReposiotry.save(findFolder);

        ctx.status = 200;
        ctx.body = {};
      }

      console.log(findFolder);
    } else {
      ctx.status = 403;
      ctx.body = { error: "token doesn't exists" };
    }
  }
}
