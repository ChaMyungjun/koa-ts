/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { request, responsesAll, summary, tagsAll } from "koa-swagger-decorator";
import { ChangeStream, getManager, Repository } from "typeorm";

import { comparePassword, User } from "../entity/user";

import { Token } from "../entity/token";
import { Music } from "../entity/music";
import { latest, musicLike } from ".";
import { MusicLike } from "../entity/musicLike";
import { count } from "console";
import { Folder } from "../entity/folder";
import { FolderMusic } from "../entity/memo";

@responsesAll({
  200: { description: "success" },
  400: { description: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
  403: { description: ""},
})
@tagsAll(["Music"])
export default class MusicController {
  @request("get", "/music/find")
  @summary("getting music info")
  public static async gettingMusicInfo(ctx: BaseContext): Promise<void> {
    const musicRepository: Repository<Music> = await getManager().getRepository(
      Music
    );

    const MusicLikeRepository: Repository<MusicLike> = await getManager().getRepository(
      MusicLike
    );

    const UserRepository: Repository<User> = await getManager().getRepository(
      User
    );

    const TokenRepository: Repository<Token> = await getManager().getRepository(
      Token
    );

    const FolderReposiotry: Repository<Folder> = await getManager().getRepository(
      Folder
    );

    const MusicFolderRepository: Repository<FolderMusic> = await getManager().getRepository(
      FolderMusic
    );

    // console.log(ctx.request);

    const findMusic = await musicRepository.find();

    const gottenToken = ctx.request.header.authorization?.split(" ")[1];
    console.log("findMusic", findMusic);

    console.log("ctx", ctx.request);

    if (ctx.request.header.authorization?.split(" ")[1]) {
      // const findUser = await UserRepository.find({
      //   relations: ["token"],
      //   where: { token: await TokenRepository.findOne({ token: gottenToken }) },
      // });

      const findUser = await UserRepository.findOne({
        token: await TokenRepository.findOne({
          token: gottenToken,
        }),
      });

      const startPos = 0;
      const endPos = 10;

      console.log(
        "gotten token",
        ctx.request.header.authorization?.split(" ")[1]
      );
      console.log("find User", await UserRepository.find());

      console.log(findUser);

      console.log("=-=========================");

      const findMusicLike = await MusicLikeRepository.find({
        skip: 0, 
        take: 10,
        relations: ["music"],
        where: { user: findUser },
      });

      const findFolder = await FolderReposiotry.find({
        user: findUser,
      });

      const findMusicFile = await MusicFolderRepository.find({
        relations: ["music", "folder"],
      });

      let customFileData: any = [];

      findFolder.map((cur_folder, index_folder) => {
        let customMusicToData: any = [];

        findMusicFile.map((cur, index) => {
          if (cur.folder?.id === cur_folder.id) {
            let customMusic: any = {
              ...cur.music,
              memo: cur.memo,
            };

            customMusicToData.push(customMusic);
          }
        });
        customFileData.push(customMusicToData);
      });

      // console.log(findMusicLike);

      let sendingData: any = [];
      let counter = 0;

      findMusic.map((cur, index) => {
        const data = {
          ...cur,
          isLike:
            findMusicLike.findIndex(
              (ml) => ml.music.id === findMusic[index].id
            ) !== -1,

          isFile:
            findMusicFile.findIndex(
              (ml) => ml.music?.id === findMusic[index].id
            ) !== -1,
        };
        // console.log(findMusicLike[index]?.music.id);
        // console.log(cur.id);
        // if (findMusic[index].id === findMusicLike[counter]?.music.id) {
        //   sendingData.push(findMusic[index].like = findMusicLike[counter].like)
        //   counter++;
        // } else {
        //   sendingData.push(cur);
        // }

        sendingData.push(data);
      });

      // console.log(sendingData);

      ctx.status = 200;
      ctx.body = sendingData;
    } else {
      ctx.status = 200;
      ctx.body = findMusic;

      console.log("Getting Music");
    }
  }

  // @request("post", "/music/like/save")
  // @summary("testing")
  // public static async musicLikeCreate(ctx: BaseContext): Promise<void> {
  //   const musicRepository: Repository<Music> = await getManager().getRepository(
  //     Music
  //   );
  //   const userRepository: Repository<User> = await getManager().getRepository(
  //     User
  //   );
  //   const tokenRepository: Repository<Token> = await getManager().getRepository(
  //     Token
  //   );

  //   const gottenToken = ctx.request.header.authorization.split(" ")[1];

  //   const findUser = await userRepository.findOne({
  //     token: await tokenRepository.findOne({ token: gottenToken }),
  //   });

  //   if (findUser) {
  //     const getMusicData = await musicRepository.findOne({
  //       id: ctx.request.body.music_id,
  //     });

  //     const musicUserData = await musicRepository.find({
  //       relations: ["user"],
  //       where: { id: getMusicData.id },
  //     });

  //     // console.log(getMusicData);
  //     console.log(musicUserData);

  //     //Music relation exclude user => undefined

  //     let sendingData: any = [];
  //     musicUserData.map(async (cur, index) => {
  //       console.log("dfdffdfd", cur.user[index]);
  //       if (cur.user[index]?.index === findUser.index) {
  //         // 유저의 뮤직 릴레이션 제거
  //         getMusicData.user = [];
  //         await musicRepository.save(getMusicData);

  //         console.log("삭제relation delete");

  //         const findUserMusicList = await musicRepository.find({
  //           relations: ["user"],
  //         });

  //         // console.log("findUserMusic", findUserMusicList);

  //         let sendingData: any = [];

  //         findUserMusicList.map((cur, index) => {
  //           if (cur.user[index]?.index === findUser.index) {
  //             console.log("success");
  //             sendingData = cur.user;
  //           }
  //         });

  //         console.log(sendingData);

  //         ctx.status = 204;
  //       } else {
  //         // 유저에 뮤직 릴레이션 추가
  //         getMusicData.user = [findUser];
  //         await musicRepository.save(getMusicData);

  //         console.log("추가getMusicData");

  //         // const findUserMusicList = getMusicData.filter((item: any) => {
  //         //   item.index !== findUser.index;
  //         // });

  //         let sendingData: any = [];

  //         // findUserMusicList.map((cur, index) => {
  //         //   console.log("cur.user : ", cur.user);
  //         //   console.log("findUser :", findUser);
  //         //   console.log("findUser :", findUser);
  //         //   console.log("index :", cur.user.indexOf(findUser));
  //         // });

  //         console.log("sendingData", sendingData);

  //         ctx.status = 201;
  //       }
  //     });

  //     console.log(sendingData);
  //   } else {
  //     ctx.status = 403;
  //     ctx.body = { error: "token doesn't exists" };
  //   }
  // }
}
