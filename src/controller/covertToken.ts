/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import {
  getManager,
  Repository,
} from "typeorm";
import { validate, ValidationError } from "class-validator";
import {
  request,
  summary,
  tagsAll,
  responsesAll,
} from "koa-swagger-decorator";
import { Token, encoded } from "../entity/token";
import { User } from "../entity/user";

@responsesAll({
  200: { description: "success" },
  400: { description: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["Social Token"])
export default class TokenController {
  @request("post", "/convert/token")
  @summary("getting social token")
  public static async getSocialToken(ctx: BaseContext): Promise<void> {
    const tokenInfo = ctx.requeset.body;

    //get a token repository to perform operations with token
    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const userRepository: Repository<User> = getManager().getRepository(User);

    //create token obj
    const tokenToBeSaved: Token = new Token();
    const userToBeSaved: User = new User();

    tokenToBeSaved.token = encoded(tokenInfo.token);
    tokenToBeSaved.tokenProvider = tokenInfo.backend;
    // tokenToBeSaved.reToken = encoded(tokendInfo.refreshtoken)
    //tokenToBeSaved.Id = tokenInfo.Id

    userToBeSaved.email = tokenInfo.email;
    userToBeSaved.token = tokenToBeSaved;

    //validate token entity
    const errors: ValidationError[] = await validate(tokenToBeSaved);

    if (errors.length > 0) {
      console.log("Error!");
      console.error(errors);
    } else if (await tokenRepository.findOne({ Id: tokenToBeSaved.Id })) {
      try {
        const tokenToRemove: Token | undefined = await tokenRepository.findOne({
          Id: tokenToBeSaved.Id,
        });

        await tokenRepository.remove(tokenToRemove).then(async (res) => {
          console.log("tokenRepository Remove");
          await tokenRepository.save(tokenToBeSaved);
        });
      } catch (err) {
        console.error("Error!");
      }
    } else {
      await tokenRepository.save(tokenToBeSaved);
      await userRepository.save(userToBeSaved);
      ctx.cookies.set = encoded(tokenInfo.token);
      ctx.status = 201;
    }
  }
}

/**
 *
 *  
 * {
  token: 'YUDDdb0wyRusNVQf8mnNBgvdXyVzdz37Po3BsAopyV4AAAF2A2lrKg',
  grant_type: 'convert_token',
  backend: 'kakao',
  client_id: '3040da9b120368bb91958c4d4eb5511e',
  email: 'dgkim3811@naver.com'
}
 * 
 * 
 */
