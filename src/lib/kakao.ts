/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseContext } from "koa";
import { getManager, Repository, Not, Equal, Like } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, responsesAll, summary, tagsAll } from "koa-swagger-decorator";
import passport from "koa-passport";

import { Token, tokenSchema, encoded, reencoded } from "../entity/token";

//get Token => encoded function
export async function KakaogetToken(
  accessToken: any,
  refreshToken: any,
  profile: any
) {
  console.log(typeof accessToken);
  if (accessToken) {
    console.log("success");
    const token = encoded(accessToken);
    const retoken = reencoded(refreshToken);
    console.log("lib token type:", typeof token);
    console.log("lib retoken type:", typeof retoken);

    const tokenRepsitory: Repository<Token> = getManager().getRepository(Token);

    const tokenToBeSaved: Token = new Token();
    tokenToBeSaved.Id = profile._json.id;
    tokenToBeSaved.token = token;
    tokenToBeSaved.reToken = retoken;
    tokenToBeSaved.tokenProvider = profile.provider;

    const errors: ValidationError[] = await validate(tokenToBeSaved);

    if (errors.length > 0) {
      console.error(errors);
    } else if (await tokenRepsitory.findOne({ Id: tokenToBeSaved.Id })) {
      console.error("error!");
    } else {
      const token = await tokenRepsitory.save(tokenToBeSaved);
      console.log(token);
    }
  }
}
