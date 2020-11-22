/* eslint-disable @typescript-eslint/no-explicit-any */
import { SwaggerRouter } from "koa-swagger-decorator";
import passport from "koa-passport";
import { user, company } from "./controller";

import { KakaogetToken } from "./lib/kakao";
import { NavergetToken } from "./lib/naver";

const protectedRouter = new SwaggerRouter();
const kakaoStrategy = require("./social/kakao.index").KakaoStrategy;
const naverStrategy = require("./social/naver.index").NaverStrategy;

// USER ROUTES
protectedRouter.get("/users", user.getUsers); //All Member find
protectedRouter.post("/user/login", user.getUser); //Login
protectedRouter.post("/user/register", user.createUser); //register
protectedRouter.put("/user/modify", user.updateUser); //modify
protectedRouter.delete("/users/:id", user.deleteUser); //specified member delete
protectedRouter.delete("/testusers", user.deleteTestUsers); // All member delete
//protectedRouter.post("/user/logout", user.logoutUser); //user logout

//kakao URL, API Key, code value
const kakaoKey = {
  clientID: process.env.kakao_rest_api,
  clientSecret: process.env.kakao_secret_key,
  callbackURL: process.env.kakao_redirect_url,
};

//naver URL, API Key, code value
const naverKey = {
  clientID: process.env.naver_rest_api,
  clientSecret: process.env.naver_secret_key,
  callbackURL: process.env.naver_redirect_url,
};

//generate Strategy => call kakao api(login)
passport.use(
  "kakao-login",
  new kakaoStrategy(
    kakaoKey,
    (accessToken: any, refreshToken: any, profile: any) => {
      console.log(profile);
      if (accessToken) {
        KakaogetToken(accessToken, refreshToken, profile);
        console.log("Success");
      }
    }
  )
);

//generate Strategy => call naver api(login)
passport.use(
  "naver-login",
  new naverStrategy(
    naverKey,
    (accessToken: any, refreshToken: any, profile: any) => {
      //USER.info is profile
      if (accessToken) {
        console.log(profile);
        NavergetToken(accessToken, refreshToken, profile);
      }
    }
  )
);

//kakao Routes
protectedRouter.get("/kakao/login", passport.authenticate("kakao-login"));

//naver Routes
protectedRouter.get("/naver/login", passport.authenticate("naver-login"));

//company data getting
protectedRouter.post("/company/register", company.createCompany);

//kakao redirect
protectedRouter.get(
  "/user/kakao/auth",
  passport.authenticate("kakao-login", {
    successRedirect: "/",
    failureRedirect: "/test",
  })
);

//naver redirect
protectedRouter.get(
  "/user/naver/auth",
  passport.authenticate("naver-login", {
    successRedirect: "/",
    failureRedirect: "/test",
  })
);

// social logout
// delete token in db
protectedRouter.post("/user/logout", user.logoutUser);

// Swagger endpoint
protectedRouter.swagger({
  title: "node-typescript-koa-rest",
  description:
    "API REST using NodeJS and KOA framework, typescript. TypeORM for SQL with class-validators. Middlewares JWT, CORS, Winston Logger.",
  version: "1.5.0",
});

// mapDir will scan the input dir, and mautomatically call router.map to all Router Class
protectedRouter.mapDir(__dirname);

export { protectedRouter };
