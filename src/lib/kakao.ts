/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getManager, Repository, Not, Equal, Like } from "typeorm";
import { validate, ValidationError } from "class-validator";

import { Token, tokenSchema, encoded, reencoded } from "../entity/token";

//get Token => encoded function
export async function KakaogetToken(
  accessToken: any,
  refreshToken: any,
  profile: any
) {
  console.log(typeof accessToken);
  if (accessToken) {
    console.log("accessToken Value:", accessToken);
    const token = encoded(accessToken);
    const retoken = reencoded(refreshToken);

    const tokenRepsitory: Repository<Token> = getManager().getRepository(Token);

    const tokenToBeSaved: Token = new Token();
    tokenToBeSaved.Id = profile._json.id;
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
        console.error("Error!");
      }
    } else {
      const token = await tokenRepsitory.save(tokenToBeSaved);
      console.log(token);
    }
  }
}
