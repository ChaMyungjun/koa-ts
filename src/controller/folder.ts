/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { AdvancedConsoleLogger, getManager, Repository } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, responsesAll, tagsAll } from "koa-swagger-decorator";
import { Token } from "../entity/token";
import { User } from "../entity/user";
import { Folder } from "../entity/folder";
import { Music } from "../entity/music";
import { send } from "process";
import { find } from "shelljs";
import { FolderMusic } from "../entity/memo";
import { folder } from ".";
import { forEach } from "lodash";

@responsesAll({
  200: { descriptoin: "success" },
  400: { description: "bad requset" },
  401: { descriptoin: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["Folder"])
export default class FolderController {
  @request("post", "/music/folder/create")
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

    const gottenToken = ctx.request.header.authorization.split(" ")[1];
    console.log(gottenToken);

    console.log("title", ctx.request.body.title);

    const folderData = ctx.request.body.product;
    const memoData = ctx.request.body.memo;
    const title = ctx.request.body.title;

    // console.log("folderData", folderData);

    const findUser = await UserRepository.find({
      relations: ["token"],
      where: { token: await TokenRepository.findOne({ token: gottenToken }) },
    });

    const FoldToBeSaved: Folder = new Folder();

    console.log(findUser);

    if (findUser) {
      // FoldToBeSaved.memo = memoData;
      FoldToBeSaved.title = title;
      FoldToBeSaved.user = findUser[0];

      console.log("product doesn't exits");

      const errors: ValidationError[] = await validate(FoldToBeSaved);

      if (errors.length > 0) {
        console.log("first");
        ctx.status = 400;
        ctx.body = errors;
      } else if (
        await FolderReposiotry.findOne({ title: FoldToBeSaved.title })
      ) {
        console.log("seconde");
        ctx.status = 400;
        ctx.body = { error: "이미 존재하는 폴더 이름 입니다." };
      } else if (!title) {
        ctx.status = 400;
        ctx.body = { error: "폴더 이름이 없습니다." };
      } else {
        const folder = await FolderReposiotry.save(FoldToBeSaved);

        console.log(folder);

        ctx.status = 200;
        ctx.body = { message: "created" };
      }
    } else {
      ctx.status = 403;
      ctx.body = { error: "token doesn't exist" };
    }
  }

  @request("post", "/music/folder/add")
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

    const MemoRepository: Repository<FolderMusic> = getManager().getRepository(
      FolderMusic
    );

    const gottenToken = ctx.request.header.authorization.split(" ")[1];
    const musicId = ctx.request.body.songId;
    const folderID = ctx.request.body.folderId;

    const findUser = await UserRepository.find({
      relations: ["token"],
      where: { token: await TokenRepository.findOne({ token: gottenToken }) },
    });

    if (findUser) {
      const getMusicData = await MusicRepository.findOne({ id: musicId });
      const findFolder = await FolderReposiotry.findOne({
        id: folderID,
      });

      console.log("findFoler checking", findFolder);

      const folderMusicToBeSaved = new Folder();

      console.log("get Music Data", getMusicData);
      // console.log("find Folder", findFolder.user);

      // folderMusicToBeSaved.title = findFolder.title;
      // folderMusicToBeSaved.user = findFolder.user;
      // folderMusicToBeSaved.memo = ctx.request.body?.memo;
      // folderMusicToBeSaved.music = getMusicData;

      const memoToBeSaved = new FolderMusic();

      memoToBeSaved.memo = ctx.request.body.memo;
      memoToBeSaved.music = getMusicData;
      memoToBeSaved.folder = findFolder;

      console.log("saved muisc data", memoToBeSaved.music);

      console.log(
        "chekcing",
        await MemoRepository.find({
          folder: findFolder,
        })
        // findFolder
      );

      console.log("find User", findUser[0]);

      if (
        await MemoRepository.findOne({
          music: memoToBeSaved.music,
          folder: findFolder,
        })
      ) {
        // const UserFolderList = await FolderReposiotry.find({
        //   relations: ["music"],
        //   where: { user: findUser },
        //   order: { createdat: "ASC" },
        // });

        // let sendingData: any = [];

        // UserFolderList.map((cur, index) => {
        //   console.log("music mapping data", cur);
        // });

        // console.log("Music Folder List", UserFolderList);
        // console.log("UserFolderList Music ", sendingData);

        ctx.status = 400;
        ctx.body = { error: "음악이 현재 폴더 들어 있습니다." };
      } else {
        const memo = await MemoRepository.save(memoToBeSaved);

        console.log("saving value memo", memo);

        const UserFolderList = await FolderReposiotry.find({
          relations: ["user"],
          where: {
            user: findUser[0],
          },
        });

        const MemoList = await MemoRepository.find({
          relations: ["music", "folder"],
          where: {
            folder: await FolderReposiotry.findOne({ user: findUser[0] }),
          },
        });

        console.log("user folder List", UserFolderList);
        console.log("user memo list", MemoList);

        let sendingData: any = [];

        // UserFolderList.map((cur, index) => {
        //   const data: any = {
        //     ...cur,
        //     music: cur.folderMusic.music,
        //   };

        //   sendingData.push(data);
        // });
        // console.log(
        //   "find User",
        //   await UserRepository.findOne({
        //     token: await TokenRepository.findOne({ token: gottenToken }),
        //   })
        // );
        UserFolderList.map((cur_folder, index_folder) => {
          let customMusicToData: any = [];

          MemoList.map((cur, index) => {
            if (cur.folder.id === cur_folder.id) {
              let customMusic: any = {
                ...cur.music,
                memo: cur.memo,
              };

              customMusicToData.push(customMusic);
            }
          });
          const data = {
            ...cur_folder,
            music: customMusicToData,
          };
          console.log();
          sendingData.push(data);
        });

        console.log("sending Data", sendingData);
        // console.log("user folder List", UserFolderList);
        // console.log("user memo list", MemoList);

        ctx.status = 200;
        ctx.body = sendingData;
      }
    } else {
      ctx.status = 403;
      ctx.body = { error: "token doesn't exists" };
    }
  }

  @request("get", "/music/folder/find")
  @summary("init folder list")
  public static async listFolder(ctx: BaseContext): Promise<void> {
    const UserRepository: Repository<User> = getManager().getRepository(User);
    const TokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );

    const FolderReposiotry: Repository<Folder> = getManager().getRepository(
      Folder
    );

    const MemoRepository: Repository<FolderMusic> = getManager().getRepository(
      FolderMusic
    );

    // const MusicRepository: Repository<Music> = getManager().getRepository(
    //   Music
    // );

    const gottenToken = ctx.request.header.authorization.split(" ")[1];

    const findUser = await UserRepository.find({
      relations: ["token"],
      where: { token: await TokenRepository.findOne({ token: gottenToken }) },
    });
    console.log("folder find User", findUser);

    if (findUser) {
      const FolderList = await FolderReposiotry.find({
        user: findUser[0],
      });

      const MemoList = await MemoRepository.find({
        relations: ["music", "folder"],
        where: {
          folder: await FolderReposiotry.findOne({ user: findUser[0] }),
        },
      });

      let sendingData: any = [];

      // FolderList.map((cur, index) => {
      //   const data: any = {
      //     ...cur,
      //     // music: cur.memo.music,
      //   };

      //   sendingData.push(data);
      // });

      console.log(FolderList);
      console.log(MemoList);

      FolderList.map((cur_folder, index_folder) => {
        console.log("mapping");
        let customMusicToData: any = [];
        MemoList.map((cur, index) => {
          console.log("mapping22");
          if (cur.folder.id === cur_folder.id) {
            let customMusic: any = {
              ...cur.music,
              memo: cur.memo,
            };
            customMusicToData.push(customMusic);
            console.log(customMusicToData);
          }
        });

        const data = {
          ...cur_folder,
          music: customMusicToData,
        };

        sendingData.push(data);
        console.log(data);
      });

      // FolderList.map((cur, index) => {
      //   console.log(cur.folderMusic.music);
      //   const data = {
      //     ...cur,
      //     folderMusic: {
      //       ...cur.folderMusic.music,
      //     },
      //   };

      //   sendingData.push(data);
      // });

      console.log("sending data", sendingData);

      ctx.status = 200;
      ctx.body = sendingData;
    } else {
      console.log("token doesn't exists");
      ctx.status = 200;
      ctx.body = { error: "token doesn't exists" };
    }
  }
}

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
