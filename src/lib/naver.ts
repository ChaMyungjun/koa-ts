/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import { getManager, Repository, Not, Equal, Like } from "typeorm";
import { validate, ValidationError } from "class-validator";

import {
  Token,
  tokenSchema,
  encoded,
  reencoded,
  decoded,
} from "../entity/token";
import { cat } from "shelljs";
import { access } from "fs";

export async function NavergetToken(
  accessToken: any,
  refreshToken: any,
  profile: any
) {
  console.log(typeof accessToken);
  if (accessToken) {
    console.log("success");
    const token = encoded(accessToken);
    const retoken = reencoded(refreshToken);

    console.log(accessToken);

    // const testToken = encoded("asdfasdf");
    // console.log("test", testToken);
    // const decodedToken = decoded(testToken);
    // console.log("test", decodedToken);

    const tokenRepsitory: Repository<Token> = getManager().getRepository(Token);

    const tokenToBeSaved: Token = new Token();
    tokenToBeSaved.Id = profile.id;
    tokenToBeSaved.token = token;
    tokenToBeSaved.reToken = retoken;
    tokenToBeSaved.tokenProvider = profile.provider;

    //error checking
    const errors: ValidationError[] = await validate(tokenToBeSaved);
    if (errors.length > 0) {
      console.error(errors);
    } else if (await tokenRepsitory.findOne({ Id: tokenToBeSaved.Id })) {
      try {
        const tokenToRemove: Token | undefined = await tokenRepsitory.findOne({
          Id: profile._json.id,
        });
        await tokenRepsitory.remove(tokenToRemove).then(async (res) => {
          console.log(res);

          const token = await tokenRepsitory.save(tokenToBeSaved);
          console.log(token);

          console.log("Delete Success & Add Success");
        });
        console.log("already exists");
      } catch (err) {
        console.error(err);
      }
    } else {
      const token = await tokenRepsitory.save(tokenToBeSaved);
      console.log(token);
    }
  }
}
