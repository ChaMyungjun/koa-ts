import Router from "@koa/router";
import { general, latest, music, musicLike, folder } from "./controller";

const unprotectedRouter = new Router();

// Hello World route
unprotectedRouter.get("/", general.helloWorld);

//music list
unprotectedRouter.get("/music/find", music.gettingMusicInfo);

//music playlist
unprotectedRouter.get("/music/latest", latest.initLatestMusic);

//music like save
unprotectedRouter.get("/music/like/save", musicLike.listMusicLike);

//music folder list
unprotectedRouter.get("/music/folder/find", folder.listFolder);

export { unprotectedRouter };
