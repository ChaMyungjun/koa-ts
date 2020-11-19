/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { getManager, Repository, Not, Equal, Like } from "typeorm";
import { validate, ValidationError } from "class-validator";
import {
  request,
  summary,
  path,
  body,
  responsesAll,
  tagsAll,
} from "koa-swagger-decorator";
import {
  User,
  userSchema,
  hashedPassword,
  comparePassword,
} from "../entity/user";
import passport from "koa-passport";

const kakaoStrategy = require("../social/kakao.index").KakaoStrategy;

@responsesAll({
  200: { description: "success" },
  400: { description: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["User"])
export default class TestController {
  @request("get", "/kakao/test")
  @summary("kakao db testing")
  public static async getKakaoTest(ctx: BaseContext): Promise<void> {
    //kakao URL, API Key, code value
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
          console.log(accessToken);
        }
      )
    );
  }
}
