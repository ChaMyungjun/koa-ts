/* eslint-disable @typescript-eslint/no-explicit-any */
import { SwaggerRouter } from "koa-swagger-decorator";
import passport from "koa-passport";
import { user, kakao } from "./controller";

const protectedRouter = new SwaggerRouter();
const kakaoStrategy = require("./social").Strategy;

// USER ROUTES
protectedRouter.get("/users", user.getUsers); //All Member find
protectedRouter.post("/login/local", user.getUser); //Login
protectedRouter.post("/register/local", user.createUser); //register
protectedRouter.put("/users/:id", user.updateUser); //modify
protectedRouter.delete("/users/:id", user.deleteUser); //specified member delete
protectedRouter.delete("/testusers", user.deleteTestUsers); // All member delete

//kakao Routes
// protectedRouter.get("/kakao/auth", passport.authenticate("kakao-auth"));
//error passport is not a function

console.log(process.env.kakao_secret_key);

const kakaoKey = {
  clientID: process.env.kakao_rest_api,
  clientSecret: process.env.kakao_secret_key,
  callbackURL: process.env.kakao_redirect_url,
};

passport.use(
  "kakao-login",
  new kakaoStrategy(
    kakaoKey,
    (accessToken: any, refreshToken: any, profile: any) => {
      //USER.info is profile
      console.log(profile);
    }
  )
);

protectedRouter.get("/kakao/login", passport.authenticate("kakao-login"));

protectedRouter.get(
  "/user/kakao/auth",
  passport.authenticate("kakao-login", {
    successRedirect: "/",
    failureRedirect: "/test",
  })
);

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
