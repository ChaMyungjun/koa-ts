/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { inherits } from "util";
import OauthStrategy from "passport-oauth2";
import axios from "axios"

import { StrategyOptionsKakao, ProfileKakao } from "./social.types";

const DEFAULT_CLIENT_SECRET = "kakao";
const OAUTH_HOST = "https://kauth.kakao.com";
const USER_PROFILE_URL = "https://kapi.kakao.com/v2/user/me";
const CHECK_TOKEN = "https://kapi.kakao.com/v1/user/access_token_info";

//checking access_token valid
// export const checkToken = (token: any) => {
//   //kakao checking token ? 401 : 200
//   //400 code -2 => token typeError
//   //400 code -1 => internel server error(temporary server stopping)

//   const data = axios(`${CHECK_TOKEN}`, {
//     headers: {'Au'}
//   })

// }

export const buildOptions = (options: StrategyOptionsKakao) => {
  //URL change
  options.authorizationURL = `${OAUTH_HOST}/oauth/authorize`;
  options.tokenURL = `${OAUTH_HOST}/oauth/token`;

  //kakao code checking
  if (!options.clientSecret) {
    options.clientSecret = DEFAULT_CLIENT_SECRET;
  }

  options.scopeSeparator = options.scopeSeparator || ",";
  options.customHeaders = options.customHeaders || {};

  if (!options.customHeaders["User-Agent"]) {
    options.customHeaders["User-Agent"] = options.userAgent || "passport-kakao";
  }

  return options;
};

function KakaoStrategy(options: StrategyOptionsKakao = {}, verify: any) {
  OauthStrategy.call(this, buildOptions(options), verify);
  this.name = "kakao";
  this._userProfileURL = USER_PROFILE_URL;
}

/**
 * `OauthStrategy`를 상속 받는다.
 * Strategy => OauthStrategy possible
 */
inherits(KakaoStrategy, OauthStrategy);

//getting user Profile
//succes => profile.info
//fail => error
KakaoStrategy.prototype.userProfile = function (
  accessToken: string,
  done: (error: Error, profile?: ProfileKakao) => void
) {
  this._oauth2.get(
    this._userProfileURL,
    accessToken,
    (err: Error, body: string) => {
      if (err) {
        return done(err);
      }

      try {
        const json = JSON.parse(body);
        // 카카오톡이나 카카오스토리에 연동한 적이 없는 계정의 경우
        // properties가 비어있다고 한다. 없을 경우의 처리
        const properties = json.properties || {
          nickname: "미연동 계정",
        };
        const profile: ProfileKakao = {
          provider: "kakao",
          id: json.id,
          username: properties.nickname,
          displayName: properties.nickname,
          _raw: body,
          _json: json,
        };
        return done(null, profile);
      } catch (e) {
        return done(e);
      }
    }
  );
};

export default KakaoStrategy;
