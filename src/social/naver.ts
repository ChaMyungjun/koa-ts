/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
// import * as util from "util";
// import OauthStrategy from "passport-oauth2";

// import { StrategyOptionsNaver, ProfileNaver } from "./social.types";

// //Change naver URL
// const DEFAULT_CLIENT_SECRET = "naver";
// const OAUTH_HOST = "https://nid.naver.com";
// const USER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me";

// export const buildOptions = (options: StrategyOptionsNaver) => {
//   //URL change
//   options.authorizationURL =
//     options.authorizationURL || `${OAUTH_HOST}/oauth2.0/authorize`;
//   options.tokenURL = options.tokenURL || `${OAUTH_HOST}/oauth2.0/token'`;

//   //naver code checking
//   if (!options.clientSecret) {
//     options.clientSecret = DEFAULT_CLIENT_SECRET;
//   }

//   return options;
// };

// function NaverStrategy(options: StrategyOptionsNaver = {}, verify: any) {
//   OauthStrategy.call(this, buildOptions(options), verify);
//   this.name = "naver";
//   this._userProfileURL = USER_PROFILE_URL;
//   this._oauth2.setAccessTokenName("access_token");
// }

// util.inherits(NaverStrategy, OauthStrategy);

// NaverStrategy.prototype.userProfile = function (
//   accessToken: string
//   //done: (err: Error, profile?: ProfileNaver) => void
// ) {
//   this._oauth2.useAuthorizationHeaderforGET(true);
//   this._oaut2.get(
//     this._userProfileURL,
//     accessToken,
//     (err: Error, body: string) => {
//       if (err) {
//         return console.error(err);
//       }

//       try {
//         const json = JSON.parse(body);
//         console.log(json);
//       } catch (err) {
//         console.error(err);
//       }

//       // try {
//       //   const json = JSON.parse(body);

//       //   const properties = json.properties || {
//       //     nickname: "not connection account",
//       //   };
//       //   const profile: ProfileNaver = {
//       //     provider: "naver",
//       //     id: json.id,
//       //     username: properties.nickname,
//       //     displayname: properties.nickname,
//       //     _raw: body,
//       //     _json: json,
//       //   };
//       //   return console.log(profile);
//       // } catch (err) {
//       //   console.error(err);
//       // }
//     }
//   );
// };

// export default NaverStrategy;

// var util = require('util'),
// 	_ = require('underscore'),
// 	Profile = require('./profile'),
// 	OAuth2Strategy = require('passport-oauth').OAuth2Strategy,
// 	InternalOAuthError = require('passport-oauth').InternalOAuthError,
// 	NaverAPIError = require('./errors/naverapierror');
import util from "util";
import _ from "underscore";
import OauthStrategy from "passport-oauth2";
import { ProfileNaver } from "./social.types";
/**
 * `Strategy` constructor
 *
 *   const DEFAULT_CLIENT_SECRET = "kakao";
 *   const OAUTH_HOST = "https://kauth.kakao.com";
 *   const USER_PROFILE_URL = "https://kapi.kakao.com/v2/user/me";
 */

const DEFAULT_CLIENT = "naver";
const OAUTH_HOST = "https://nid.naver.com";
const TOKEN_URL = "https://openapi.naver.com/v1/nid/me";

function NaverStrategy(options: any, verify: any) {
  options = options || {};

  options.authorizationURL = options.authorizationURL || `${OAUTH_HOST}/oauth2.0/authorize`;
  options.tokenURL = options.tokenURL || `${OAUTH_HOST}/oauth2.0/token`;

  // @todo Deprecate note: passing of `svcType`, `authType` param via constructor.
  // @see https://github.com/jaredhanson/passport-facebook#re-asking-for-declined-permissions
  this.__options = options;

  OauthStrategy.call(this, options, verify);
  this.name = DEFAULT_CLIENT;

  this._profileURL =
    options.profileURL || TOKEN_URL;
  this._oauth2.setAccessTokenName("access_token");
}

/**
 * Inherit from `OAuthStrategy`.
 */
util.inherits(NaverStrategy, OauthStrategy);

/**
 * Return extra parameters to be included in the authorization request.
 */
NaverStrategy.prototype.authorizationParams = function (options: any) {
  // Do not modify `options` object.
  // It will hurts original options object which in `passport.authenticate(..., options)`
  let params = _.extend({}, options);
  params["response_type"] = "code";

  // @see https://github.com/naver/passport-naver/commit/2d88b7aeb14ce04db81a145b2933baabba80612b
  // @see http://gamedev.naver.com/index.php/%EC%98%A8%EB%9D%BC%EC%9D%B8%EA%B2%8C%EC%9E%84:OAuth_2.0_API
  if (this.__options.svcType !== undefined)
    params["svctype"] = this.__options.svcType;
  // @see https://github.com/naver/passport-naver#re-authentication
  if (this.__options.authType !== undefined)
    params["auth_type"] = this.__options.authType;

  return params;
};

/**
 * Retrieve user profile from Naver.
 */
NaverStrategy.prototype.userProfile = function (accessToken: any, done: any) {
  // Need to use 'Authorization' header to save the access token information
  // If this header is not specified, the access token is passed in GET method.
  this._oauth2.useAuthorizationHeaderforGET(true);

  // User profile API
  this._oauth2.get(this._profileURL, accessToken, function (
    err: any,
    body: any
  ) {
    // @note Naver API will response with status code 200 even API request was rejected.
    // Thus, below line will not executed until Naver API changes.
    if (err) {
      return console.error(err);
    }

    // parse the user profile API Response to JSON object
    let parsed = [];
    try {
      parsed = JSON.parse(body);
      console.log(parsed);
    } catch (err) {
      return console.error(err);
    }
    let resultcode = parsed.resultcode;
    let resultmessage = parsed.message;
    let resultbody = parsed.response;

    //response checking
    if (!(resultcode && resultmessage)) {
      return console.error("Empty API Response");
    }

    //statsus code checking
    if (resultcode != "00") {
      return console.error("Error! is not 00");
    }

    //Naver user profile
    let profile: ProfileNaver = {
      provider: "naver",
    };
    profile.id = resultbody.id;
    profile.displayname = resultbody.nickname;
    profile.emails = [{ value: resultbody.email }];
    profile._json = {
      email: resultbody.email,
      nickname: resultbody.nickname,
      profileImage: resultbody.profile_image,
      age: resultbody.age,
      birthday: resultbody.birthday,
      id: resultbody.id, // User Unique ID (not naver id)
    };

    done(null, profile);
  });
};

/**
 * Expose `Strategy`.
 */
export default NaverStrategy;
