/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseContext } from "koa";
import { request, responsesAll, summary, tagsAll } from "koa-swagger-decorator";
import passport from "passport";

const kakaoStrategy = require("../social").Strategy;

@responsesAll({
  200: { description: "success" },
  400: { description: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["kakao"])
export default class KakaoController {
  @request("get", "/kakao/auth")
  @summary("kakao login")
  public static async getUser(ctx: BaseContext): Promise<void> {
    const kakaoKey = {
      clientID: process.env.kakao_rest_api,
      clientSecret: process.env.kakao_secret_key,
      callbackURL: process.env.kakao_redirect_url,
    };

    passport.use(
      "kakao-login",
      new kakaoStrategy(
        kakaoKey,
        (accessToken: any, refreshToken: any, profile: any, done: any) => {
          //USER.info is profile
          console.log(accessToken);
        }
      )
    );
    ctx.status = 200;
  }
}
