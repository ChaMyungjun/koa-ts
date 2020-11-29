/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { getManager, Repository, createConnection } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, tagsAll, responsesAll } from "koa-swagger-decorator";
import { Token, encoded } from "../entity/token";
import { User } from "../entity/user";

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
    //console.log(ctx.request.body);
    const tokenInfo = ctx.request.body;
    const encodedToken = encoded(tokenInfo.token);

    //get a token repository to perform operations with token
    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const userRepository: Repository<User> = getManager().getRepository(User);

    //create token obj
    const tokenToBeSaved: Token = new Token();
    const userToBeSaved: User = new User();

    tokenToBeSaved.token = encodedToken;
    tokenToBeSaved.tokenProvider = tokenInfo.backend;
    tokenToBeSaved.reToken = encoded(tokenInfo.refresh_token);
    tokenToBeSaved.Id = tokenInfo.id;

    userToBeSaved.email = tokenInfo.email;
    userToBeSaved.token = tokenToBeSaved;

    //validate token entity
    const errors: ValidationError[] = await validate(tokenToBeSaved);

    if (errors.length > 0) {
      console.log("Error!: ", errors);
    } else if (await tokenRepository.findOne({ Id: tokenToBeSaved.Id })) {
      try {
        console.log("remove");
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

        ctx.cookies.set("access_token", encodedToken);
        ctx.status = 201;
      } catch (err) {
        console.error("Error!", err);
      }
    } else {
      await tokenRepository.save(tokenToBeSaved);
      await userRepository.save(userToBeSaved);
      //console.log({ user, token });
      ctx.cookies.set("access_token", encodedToken);
      ctx.status = 201;
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
