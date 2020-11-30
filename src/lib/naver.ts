/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AdvancedConsoleLogger, getManager, Repository } from "typeorm";
import { validate, ValidationError } from "class-validator";

import { Token, encoded, reencoded } from "../entity/token";

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

    const tokenRepsitory: Repository<Token> = getManager().getRepository(Token);
    const userRepository: Repository<User> = getManager().getRepository(User);

    const tokenToBeSaved: Token = new Token();
    const userToBeSaved: User = new User();

    tokenToBeSaved.Id = profile.id;
    tokenToBeSaved.token = token;
    tokenToBeSaved.reToken = retoken;
    tokenToBeSaved.tokenProvider = profile.provider;

    userToBeSaved.email = profile._json.email;
    userToBeSaved.token = tokenToBeSaved;

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
          const user = await userRepository.save(userToBeSaved);
        });
      } catch (err) {
        console.error("Error!", err);
      }
    } else {
      const token = await tokenRepsitory.save(tokenToBeSaved);
      const user = await userRepository.save(userToBeSaved);
      console.log({ token, user });
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
