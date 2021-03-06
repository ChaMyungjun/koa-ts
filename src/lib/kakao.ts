/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getManager, Repository } from "typeorm";
import { validate, ValidationError } from "class-validator";

import { Token, encoded, reencoded } from "../entity/token";

import { User } from "../entity/user";

//get Token => encoded function
export async function KakaogetToken(
  accessToken: any,
  refreshToken: any,
  profile: any
) {
  if (accessToken) {
    const token = encoded(accessToken);
    const retoken = reencoded(refreshToken);

    const tokenRepsitory: Repository<Token> = getManager().getRepository(Token);
    const userRepsitory: Repository<User> = getManager().getRepository(User);

    const tokenToBeSaved: Token = new Token();
    const userToBeSaved: User = new User();

    tokenToBeSaved.Id = profile._json.id;
    tokenToBeSaved.token = token;
    tokenToBeSaved.reToken = retoken;
    tokenToBeSaved.tokenProvider = profile.provider;

    //All token value
    const allTokenData = tokenToBeSaved;
    console.log(allTokenData);
    console.log(typeof allTokenData);

    userToBeSaved.token = allTokenData;
    userToBeSaved.email = profile._json.kakao_account.email;

    //error checking
    const errorsToken: ValidationError[] = await validate(tokenToBeSaved);
    const errorsUser: ValidationError[] = await validate(userToBeSaved);

    if (errorsToken.length > 0 || errorsUser.length) {
      console.log("Error!");
      console.error(errorsToken);
      console.error(errorsUser);
    } else if (await tokenRepsitory.findOne({ Id: tokenToBeSaved.Id })) {
      console.log("findone");
      try {
        const tokenToRemove: Token | undefined = await tokenRepsitory.findOne({
          Id: profile._json.id,
        });
        //console.log("tokenToRemove :", tokenToRemove);
        //await tokenRepsitory.remove(tokenToRemove);
        await tokenRepsitory.remove(tokenToRemove).then(async (res) => {
          console.log("tokenRepsitory.remove");
          await tokenRepsitory.save(tokenToBeSaved);
          const user = userRepsitory.save(userToBeSaved);
          console.log(user);
          console.log("Delete Success & Add Success");
        });
        console.log("already exists");
      } catch (err) {
        console.error("Error!", err);
      }
    } else {
      await tokenRepsitory.save(tokenToBeSaved);
      const user = await userRepsitory
        .save(userToBeSaved)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
      console.log(user);
    }
  }
}

/**
 * 
 * {
  provider: 'kakao',
  id: 1535748268,
  username: '차명준',
  displayName: '차명준',
  _raw: '{"id":1535748268,"connected_at":"2020-11-18T08:52:58Z","properties":{"nickname":"차명준"},"kakao_account":{"profile_needs_agreement":false,"profile":{"nickname":"차명준"},"has_email":true,"email_needs_agreement":false,"is_email_valid":true,"is_email_verified":true,"email":"acd70159@kakao.com","has_birthday":true,"birthday_needs_agreement":true}}',
  _json: {
    id: 1535748268,
    connected_at: '2020-11-18T08:52:58Z',
    properties: { nickname: '차명준' },
    kakao_account: {
      profile_needs_agreement: false,
      profile: [Object],
      has_email: true,
      email_needs_agreement: false,
      is_email_valid: true,
      is_email_verified: true,
      email: 'acd70159@kakao.com',
      has_birthday: true,
      birthday_needs_agreement: true
    }
  }
}
 * 
 */
