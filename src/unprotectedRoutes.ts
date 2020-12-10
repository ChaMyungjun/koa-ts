import Router from "@koa/router";
import { general, music } from "./controller";

const unprotectedRouter = new Router();

// Hello World route
unprotectedRouter.get("/", general.helloWorld);

//music find
unprotectedRouter.get("/music/find", music.gettingMusicInfo);

//test route
// unprotectedRouter.get("/test", test.testing);

export { unprotectedRouter };
