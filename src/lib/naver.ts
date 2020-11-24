/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import {
  getManager,
  Repository,
  Not,
  Equal,
  Like,
  getMongoManager,
} from "typeorm";
import { validate, ValidationError } from "class-validator";

import {
  Token,
  tokenSchema,
  encoded,
  reencoded,
  decoded,
} from "../entity/token";

import { User } from "../entity/user";

export async function NavergetToken(
  accessToken: any,
  refreshToken: any,
  profile: any
) {
  console.log(typeof accessToken);
  if (accessToken) {
    const token = encoded(accessToken);
    const retoken = reencoded(refreshToken);

    // const testToken = encoded("asdfasdf");
    // console.log("test", testToken);
    // const decodedToken = decoded(testToken);
    // console.log("test", decodedToken);

    const tokenRepsitory: Repository<Token> = getManager().getRepository(Token);
    const userRepository: Repository<User> = getManager().getRepository(User);

    const tokenToBeSaved: Token = new Token();
    tokenToBeSaved.Id = profile.id;
    tokenToBeSaved.token = token;
    tokenToBeSaved.reToken = retoken;
    tokenToBeSaved.tokenProvider = profile.provider;

    console.log(profile._json.email);

    const userToBeSaved: User = new User();
    userToBeSaved.email = profile._json.email;
    userToBeSaved.password = null;
    userToBeSaved.name = null;

    //error checking
    const errors: ValidationError[] = await validate(tokenToBeSaved);
    if (errors.length > 0) {
      console.log("Error");
    } else if (await tokenRepsitory.findOne({ Id: tokenToBeSaved.Id })) {
      try {
        const tokenToRemove: Token | undefined = await tokenRepsitory.findOne({
          Id: profile._json.id,
        });
        await tokenRepsitory.remove(tokenToRemove).then(async (res) => {
          await tokenRepsitory.save(tokenToBeSaved);
          console.log("Delete Success & Add Success");
        });
        console.log("already exists");
      } catch (err) {
        console.log("Error!");
      }
    } else {
      await tokenRepsitory.save(tokenToBeSaved);
      const user = await userRepository.save(userToBeSaved);
      console.log("USER: ", user);
    }
  }
}

/**
 * 
 * 
 * {
  provider: 'naver',
  id: '89567170',
  displayname: 'dbrrowkd',
  emails: [ { value: 'cha9449@outlook.kr' } ],
  _json: {
    email: 'cha9449@outlook.kr',{
  provider: 'naver',
  id: '89567170',
  displayname: 'dbrrowkd',
  emails: [ { value: 'cha9449@outlook.kr' } ],
  _json: {
    email: 'cha9449@outlook.kr',
    nickname: 'dbrrowkd',
    profileImage: undefined,
    age: '10-19',
    birthday: '09-04',
    id: '89567170'
  }
}
    nickname: 'dbrrowkd',
    profileImage: undefined,
    age: '10-19',
    birthday: '09-04',
    id: '89567170'
  }
}
 * 
 * 
 */
