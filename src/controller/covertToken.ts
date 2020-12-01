/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { getManager, Repository, createConnection } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, tagsAll, responsesAll } from "koa-swagger-decorator";
import {
  Token,
  encoded,
  naverGenerateToken,
  naverGenerateProfile,
} from "../entity/token";
import { User } from "../entity/user";
import { token } from ".";

@responsesAll({
  200: { description: "success" },
  400: { description: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
  403: { description: "" },
})
@tagsAll(["Social Token"])
export default class TokenController {
  @request("post", "/convert/token")
  @summary("getting social token")
  public static async getSocialToken(ctx: BaseContext): Promise<void> {
    console.log(ctx.request.body);
    const tokenInfo = ctx.request.body;
    const access_token = tokenInfo.token;
    const refresh_token = tokenInfo.refresh_token;
    const expires_in = 3;

    //get a token repository to perform operations with token
    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const userRepository: Repository<User> = getManager().getRepository(User);

    //create token obj
    const tokenToBeSaved: Token = new Token();
    const userToBeSaved: User = new User();

    if (ctx.request.body.backend === "naver") {
      console.log("naver");
      //validate token entity
      const errors: ValidationError[] = await validate(tokenToBeSaved);

      console.log(ctx.request.body.state, ctx.request.body.code);
      const data: any = await naverGenerateToken(
        ctx.request.body.state,
        ctx.request.body.code
      );
      console.log(data);

      const access_token = data.access_token;
      const refresh_token = data?.refresh_token;
      const expires_in = data?.expires_in;
      const profile: any = await naverGenerateProfile(data.access_token);
      console.log(profile);

      const email = profile.email;
      const id = profile.id;

      tokenToBeSaved.token = access_token;
      tokenToBeSaved.reToken = refresh_token;
      tokenToBeSaved.expire = expires_in;
      tokenToBeSaved.Id = id;

      userToBeSaved.email = email;
      userToBeSaved.token = tokenToBeSaved;

      if (errors.length > 0) {
        console.log("Error!: ", errors);
      } else if (await tokenRepository.findOne({ Id: tokenToBeSaved.Id })) {
        try {
          console.log("remove");

          //new Token
          const tokenToRemove:
            | Token
            | undefined = await tokenRepository.findOne({
            Id: tokenToBeSaved.Id,
          });

          const userToRemove: User | undefined = await userRepository.findOne({
            email: userToBeSaved.email,
          });

          await tokenRepository.remove(tokenToRemove).then(async (res) => {
            await tokenRepository.save(tokenToBeSaved);
            console.log("tokenRepository Remove");
          });

          await userRepository.remove(userToRemove).then(async (res) => {
            await userRepository.save(userToBeSaved);
            console.log("userRepository Remove");
          });

          ctx.body = { access_token, refresh_token, expires_in };
          ctx.status = 201;
        } catch (err) {
          console.error("Error!", err);
        }
      } else {
        await tokenRepository.save(tokenToBeSaved);
        await userRepository.save(userToBeSaved);
        //console.log({ user, token });
        ctx.body = { access_token, refresh_token, expires_in };
        ctx.redirect("/");
        ctx.status = 200;
      }

      ctx.status = 404;
      ctx.body = { Test: "asdfasdf" };
    }

    //validate token entity
    const errors: ValidationError[] = await validate(tokenToBeSaved);

    //kakao data info
    tokenToBeSaved.token = access_token;
    tokenToBeSaved.tokenProvider = tokenInfo.backend;
    tokenToBeSaved.reToken = refresh_token;
    tokenToBeSaved.Id = tokenInfo.id;
    tokenToBeSaved.expire = tokenInfo.expires_in;

    userToBeSaved.email = tokenInfo.email;
    userToBeSaved.token = tokenToBeSaved;

    if (errors.length > 0) {
      console.log("Error!: ", errors);
    } else if (await tokenRepository.findOne({ Id: tokenToBeSaved.Id })) {
      try {
        console.log("remove");

        //new Token
        const tokenToRemove: Token | undefined = await tokenRepository.findOne({
          Id: tokenToBeSaved.Id,
        });

        const userToRemove: User | undefined = await userRepository.findOne({
          email: userToBeSaved.email,
        });

        await tokenRepository.remove(tokenToRemove).then(async (res) => {
          await tokenRepository.save(tokenToBeSaved);
          console.log("tokenRepository Remove");
        });

        await userRepository.remove(userToRemove).then(async (res) => {
          await userRepository.save(userToBeSaved);
          console.log("userRepository Remove");
        });

        ctx.body = { access_token, refresh_token, expires_in };
        ctx.status = 201;
      } catch (err) {
        console.error("Error!", err);
      }
    } else {
      await tokenRepository.save(tokenToBeSaved);
      await userRepository.save(userToBeSaved);
      //console.log({ user, token });
      ctx.body = { access_token, refresh_token, expires_in };
      ctx.redirect("/");
      ctx.status = 200;
    }
  }
}

/**
 *
 *  
{
  token: 'sBYMJRZcv6Gt5xLO3SZfbjdUTdt1ZXYdJC-CDQo9dBEAAAF2CGu1ZA',
  grant_type: 'convert_token',
  backend: 'kakao',
  client_id: '3040da9b120368bb91958c4d4eb5511e',
  email: 'dgkim3811@naver.com',
  refresh_token: 'LkLxxumVaPYn8ZTM-cWR16gK_gNffvztjS7UoAo9dBEAAAF2CGu1ZA',
  id: 1543255788
}
 * 
 * \
 * 
 * else if (await userRepository.findOne({ email: userToBeSaved.email })) {
      try {
        const userToRemove: User | undefined = await userRepository.findOne({
          email: userToBeSaved.email,
        });

        await userRepository.remove(userToRemove).then(async (res) => {
          console.log("userRepository Remove");
          await userRepository.save(userToBeSaved);
        });
      } catch (err) {
        console.error("Error!");
      }
    }
 * 
 * 
 * 
 * 
 */
