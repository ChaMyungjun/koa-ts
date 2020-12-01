/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import axios from "axios";
import { Token, decoded, encoded } from "../entity/token";
import { User } from "../entity/user";
import { Repository, getManager } from "typeorm";

//token check url
const CHECK_TOKEN_KAKAO = "https://kapi.kakao.com/v1/user/access_token_info";
const CHECK_TOKEN_NAVER = "https://openapi.naver.com/v1/nid/verify";

//token refresh url
const GENERATE_TOKEN_KAKAO = "https://kauth.kakao.com/oauth/token";
const GENERATE_TOKEM_NAVER = "https://nid.naver.com/oauth2.0/token";

const jwtMiddleware = async (ctx: BaseContext, next: any) => {
  const tokenRepository: Repository<Token> = getManager().getRepository(Token);
  const userRepository: Repository<User> = getManager().getRepository(User);

  const tokenSocial: Token[] = await tokenRepository.find();

  const token = ctx.cookies.get("access_token");

  //loacl login token checking
  // const tokenLocal = ctx.cookies.get("access-token");

  //token checking
  console.log(token);
  if (!token) return next();

  console.log(token);
  console.log(tokenSocial);

  const findToken = await tokenRepository.findOne({
    token: token,
  });
  console.log("findToken: ", findToken);

  //Date now (time)
  const now = Math.floor(Date.now() / 1000);

  // expire time checking (all token)
  if (decoded(token)?.exp - now < 60 * 30) {
    console.log("expire");
    try {
      console.log("token re encoded");
      // const find_refreshToken = await tokenRepository.findOne({});
      const decodedToken = decoded(token).access;

      await tokenRepository.update(await tokenRepository.getId(decodedToken), {
        token: encoded(decodedToken),
      });

      ctx.cookies.set("access_token", encoded(decodedToken));
      return next();
    } catch (err) {
      console.error("Error: ", err);
      return next();
    }
  }

  //local token checking
  // if (findToken?.tokenProvider === "local") {
  //   const decodedLocalToken = decoded(token);
  //   const decodedLocalRefreshToken = decoded(findToken.reToken);
  //   if (decodedLocalToken.exp - now < 60 * 40) {
  //     // tokenRepository.findOne({
  //     //   Id: Not(Equal(tokenSocial[index].Id)),
  //     //   token: token,
  //     //   reToken: Not(Equal(tokenSocial[index].reToken)),
  //     //   tokenProvider: Not(Equal(tokenSocial[index].tokenProvider)),
  //     // });
  //     try {
  //       await tokenRepository.update(findToken.index, {
  //         token: reGenerateToken(decodedLocalRefreshToken.access),
  //       });

  //       ctx.cookies.set(
  //         "access_token",
  //         reGenerateToken(decodedLocalRefreshToken.access)
  //       );
  //       return next();
  //     } catch (err) {
  //       console.log("Error!", err);
  //       return next();
  //     }
  //   }
  // }

  //kakao social token checking
  else if (findToken?.tokenProvider === "kakao") {
    console.log("kakao");
    const decodedKakaoToken = decoded(token).access;
    try {
      await axios
        .get(`${CHECK_TOKEN_KAKAO}`, {
          headers: { Authorization: `Bearer ${decodedKakaoToken}` },
        })
        .then((res) => {
          if (res.status === 200) {
            console.log("kakao checking token");
            return next();
          }
        });
    } catch (err) {
      const errorCode = err.response.data.code;
      if (errorCode === -401) {
        const decodedKakaoRefresh = decoded(findToken.reToken).access;
        await axios
          .get(`${GENERATE_TOKEN_KAKAO}`, {
            params: {
              grant_type: "refresh_token",
              client_id: `${process.env.kakao_rest_api}`,
              refresh_token: `${decodedKakaoRefresh}`,
            },
          })
          .then(async (res) => {
            console.log("regenerate token");
            //token value exsisting
            if (res.status === 200) {
              // tokenRepository.findOne({
              //   tokenProvider: Not(Equal(tokenSocial[index].tokenProvider)),
              //   Id: Not(Equal(tokenSocial[index].Id)),
              //   token: encoded(res.data.access_token),
              //   reToken: Not(Equal(tokenSocial[index].reToken)),
              // });
              await tokenRepository.update(findToken.index, {
                token: encoded(res.data.access_token),
              });
              ctx.cookies.set("access_token", encoded(res.data.access_token));
              return next();
            }
          });
      } else if (err.response.data.code === -2) {
        console.error("TypeError: token info is wrong");
      } else if (err.response.data.code === -1) {
        console.error("Internel Server Error in Kakao");
      } else {
        console.log("Fianl Error: ", err.response.data);
        return next();
      }
    }
  }

  //naver token checking
  else if (findToken?.tokenProvider === "naver") {
    console.log("naver");
    const decodedNaverToken = decoded(findToken.token).access;
    try {
      await axios
        .get(`${CHECK_TOKEN_NAVER}`, {
          headers: { Authorization: `Bearer ${decodedNaverToken}` },
        })
        .then((res) => {
          console.log("naver checking token");
          if (res.status === 200) {
            return next();
          }
        })
        .catch((err) => {
          console.error("Error: ", err);
          return next();
        });
    } catch (err) {
      console.log("naver error");
      if (err.response.data.resultcode === "024") {
        console.error("token type error");
      } else if (err.response.data.resultcode === "028") {
        console.error("token doesn't exist");
      } else if (err.response.data.resultcode === "unauthorized_client") {
        console.error("request unauthorization code");
      } else {
        const decodedKakaoRefresh = decoded(findToken.reToken).access;
        await axios
          .get(`${GENERATE_TOKEM_NAVER}`, {
            params: {
              client_id: `${process.env.naver_rest_api}`,
              client_secret: `${process.env.naver_secret_key}`,
              refresh_token: `${decodedKakaoRefresh}`,
              grant_type: "refresh_token",
            },
          })
          .then(async (res) => {
            console.log("naver regenerate token");
            if (res.status === 200) {
              await tokenRepository.update(findToken.index, {
                token: encoded(res.data.access_token),
              });
              ctx.cookies.set("access_token", encoded(res.data.access_token));
              return next();
            }
          })
          .catch((err) => {
            console.error("Error: ", err);
            return next();
          });
      }
      return next();
    }
  }
  // else if (decodedKakaoToken.exp - now < 60 * 40) {
  //   const decodedKakaoToken = decoded(cur.token);
  //   await tokenRepository.update(cur.index, {
  //     token: encoded(decodedKakaoToken.access),
  //   });
  // }
  return next();
};

export default jwtMiddleware;
