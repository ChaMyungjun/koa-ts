import Router from "@koa/router";
import { general, latest, music, musicLike } from "./controller";

const unprotectedRouter = new Router();

// Hello World route
unprotectedRouter.get("/", general.helloWorld);

//music find
unprotectedRouter.get("/music/find", music.gettingMusicInfo);

//music latest find
unprotectedRouter.get("/music/latest", latest.initLatestMusic);

//musi like save
unprotectedRouter.get("/music/like/save", musicLike.listMusicLike);

//test route
// unprotectedRouter.get("/test", test.testing);

export { unprotectedRouter };
