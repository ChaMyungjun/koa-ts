/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/camelcase */
import { BaseContext } from "koa";
import { getManager, Repository, Like } from "typeorm";
import { validate, ValidationError } from "class-validator";
import {
  request,
  summary,
  path,
  body,
  responsesAll,
  tagsAll,
} from "koa-swagger-decorator";
import { User } from "../entity/user";
import axios from "axios";

import { Token, encoded } from "../entity/token";

//import { Company } from "src/entity/company";
@responsesAll(["jwt"])
export default class JwtController {
  @request("post", "/jwt/check")
  @summary("regenerate token")
  public static async regenerateToken(ctx: BaseContext): Promise<void> {
    //token check url
    const CHECK_TOKEN_KAKAO =
      "https://kapi.kakao.com/v1/user/access_token_info";
    const CHECK_TOKEN_NAVER = "https://openapi.naver.com/v1/nid/verify";

    //token refresh url
    const GENERATE_TOKEN_KAKAO = "https://kauth.kakao.com/oauth/token";
    const GENERATE_TOKEM_NAVER = "https://nid.naver.com/oauth2.0/token";

    const token = ctx.request.body.access_token;
    const refreshToken = ctx.request.body.refresh_token;

    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const userRepository: Repository<User> = getManager().getRepository(User);

    if (token) {
      const findToken = await tokenRepository.findOne({ token: token });
      const findUser = await userRepository.findOne({ token: findToken });
      if (findToken?.tokenProvider === "kakao") {
        try {
          await axios
            .get(`${GENERATE_TOKEN_KAKAO}`, {
              params: {
                grant_type: "refresh_token",
                client_id: `${process.env.kakao_rest_api}`,
                refresh_token: `${refreshToken}`,
              },
            })
            .then(async (res) => {
              if (res.status === 200) {
                const tokenToBeUpdate = await tokenRepository.update(
                  findToken.index,
                  {
                    token: res.data.access_token,
                    reToken: res.data.refresh_token,
                  }
                );
                console.log(
                  await userRepository.find({ relations: ["token"] })
                );
                ctx.body = tokenToBeUpdate;
                ctx.status = 200;
              }
            });
        } catch (err) {
          ctx.status = 403;
          ctx.body = "Error";
        }
      } else if (findToken?.tokenProvider === "naver") {
        try {
          await axios
            .get(`${GENERATE_TOKEM_NAVER}`, {
              params: {
                client_id: `${process.env.naver_res_api}`,
                client_secret: `${process.env.naver_secret_key}`,
                refresh_token: `${refreshToken}`,
                grant_type: "refresh_token",
              },
            })
            .then(async (res) => {
              if (res.status === 201) {
                const tokenToBeUpdate = await tokenRepository.update(
                  findToken.index,
                  {
                    token: res.data.access_token,
                    reToken: res.data.refresh_token,
                  }
                );
                ctx.status = 201;
                ctx.body = tokenToBeUpdate;
              }
            });
        } catch (err) {
          ctx.status = 403;
          ctx.body = "Error";
        }
      }
    } else {
      ctx.status = 400;
      ctx.body = "token doesn't exist";
    }
  }
}
