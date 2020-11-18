import * as util from "util";
import OauthStrategy from "passport-oauth2";

//types
import { StrategyOptions, Profile } from "./kakao.types";

const DEFAULT_CLIENT_SECRET = "kakao";
const OAUTH_HOST = "https://kauth.kakao.com";
const USER_PROFILE_URL = "https://kapi.kakao.com/v2/me";

export const buildOptions = (options: StrategyOptions) => {
  options.authorizationURL = `${OAUTH_HOST}/oauth/authorize`;
  options.tokenURL = `${OAUTH_HOST}/oauth/token`;

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

function Strategy(options: StrategyOptions = {}, verify: unknown) {
  OauthStrategy.call(this, buildOptions(options), verify);
  this.name = "kakao";
  this._userProfileURL = USER_PROFILE_URL;
}

util.inherits(Strategy, OauthStrategy);

Strategy.prototype.userProfile = function (
  accessToken: string,
  done: (error: Error, profile?: Profile) => void
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
        //connectio with kakao story or diff
        const properties = json.properties || {
          nickname: "미연동 계정",
        };
        const profile: Profile = {
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

export default Strategy;
