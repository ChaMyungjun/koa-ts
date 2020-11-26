/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import axios from "axios";
import { Token, decoded, encoded } from "../entity/token";
import { Repository, getManager, Equal, Not } from "typeorm";
import { reGenerateToken } from "../entity/user";

//token check url
const CHECK_TOKEN_KAKAO = "https://kapi.kakao.com/v1/user/access_token_info";
const CHECK_TOKEN_NAVER = "https://openapi.naver.com/v1/nid/verify";

//token refresh url
const GENERATE_TOKEN_KAKAO = "https://kauth.kakao.com/oauth/token";
const GENERATE_TOKEM_NAVER = "https://nid.naver.com/oauth2.0/token";

const jwtMiddleware = async (ctx: BaseContext, next: any) => {
  const tokenRepository: Repository<Token> = getManager().getRepository(Token);

  const tokenSocial: Token[] = await tokenRepository.find();
  if (!tokenSocial) return next();

  //loacl login token checking
  // const tokenLocal = ctx.cookies.get("access-token");

  //Date now (time)
  const now = Math.floor(Date.now() / 1000);

  //social log in cheking token
  tokenSocial.map(async (cur, index) => {
    //local token checking

    if (cur.tokenProvider === "local") {
      const decodedLocalToken = decoded(cur.token);
      const decodedLocalRefreshToken = decoded(cur.reToken);
      const token = reGenerateToken(decodedLocalRefreshToken);
      try {
        if (decodedLocalToken.exp - now < 60 * 40) {
          tokenRepository.findOne({
            Id: Not(Equal(tokenSocial[index].Id)),
            token: token,
            reToken: Not(Equal(tokenSocial[index].reToken)),
            tokenProvider: Not(Equal(tokenSocial[index].tokenProvider)),
          });
          return next();
        }
      } catch (err) {
        console.error(err);
        return next();
      }
    }

    //kakao social token checking
    if (cur.tokenProvider === "kakao") {
      const decodedKakaoToken = decoded(cur.token);
      try {
        await axios
          .get(`${CHECK_TOKEN_KAKAO}`, {
            headers: { Authorization: `Bearer ${decodedKakaoToken.access}` },
          })
          .then((res) => {
            if (res.status === 200) {
              return next();
            }
          });
        return next();
      } catch (err) {
        if (err.response.data.code === -401) {
          const decodedKakaoRefresh = decoded(cur.reToken);
          await axios
            .get(`${GENERATE_TOKEN_KAKAO}`, {
              params: {
                grant_type: "refresh_token",
                client_id: `${process.env.kakao_rest_api}`,
                refresh_token: `${decodedKakaoRefresh.access}`,
              },
            })
            .then(async (res) => {
              //token value exsisting
              if (res.status === 200) {
                // tokenRepository.findOne({
                //   tokenProvider: Not(Equal(tokenSocial[index].tokenProvider)),
                //   Id: Not(Equal(tokenSocial[index].Id)),
                //   token: encoded(res.data.access_token),
                //   reToken: Not(Equal(tokenSocial[index].reToken)),
                // });
                await tokenRepository.update(cur.index, {
                  token: res.data.access_token,
                });
              }
            });
        } else if (err.response.data.code === -2) {
          console.error("TypeError: token info is wrong");
        } else if (err.response.data.code === -1) {
          console.error("Internel Server Error in Kakao");
        }
        console.log("Log Out");
        return next();
      }
    }

    // else if (decodedKakaoToken.exp - now < 60 * 40) {
    //   const decodedKakaoToken = decoded(cur.token);
    //   await tokenRepository.update(cur.index, {
    //     token: encoded(decodedKakaoToken.access),
    //   });
    // }

    //naver token checking
    if (cur.tokenProvider === "naver") {
      const decodedNaverToken = decoded(cur.token);
      try {
        await axios
          .get(`${CHECK_TOKEN_NAVER}`, {
            headers: { Authorization: `Bearer ${decodedNaverToken.access}` },
          })
          .then((res) => {
            if (res.status === 200) {
              return next();
            }
          });
        return next();
      } catch (err) {
        if (err.response.data.resultcode === "024") {
          console.error("token type error");
        } else {
          const decodedKakaoRefresh = decoded(cur.reToken);
          await axios
            .get(`${GENERATE_TOKEM_NAVER}`, {
              params: {
                client_id: `${process.env.naver_rest_api}`,
                client_secret: `${process.env.naver_secret_key}`,
                refresh_token: `${decodedKakaoRefresh.access}`,
                grant_type: "refresh_token",
              },
            })
            .then(async (res) => {
              if (res.status === 200) {
                await tokenRepository.update(cur.index, {
                  token: res.data.access_token,
                });
              }
            });
        }
      }
      console.log("Log Out");
      return next();
    }
  });
  return next();
};

// else if (decodedNaverToken.exp - now < 60 * 40) {
//   const decodedNaverRefresh = decoded(cur.reToken);
//   await axios
//     .get(`${GENERATE_TOKEM_NAVER}`, {
//       params: {
//         client_id: `${process.env.naver_rest_api}`,
//         client_secret: `${process.env.naver_secret_key}`,
//         refresh_token: `${decodedNaverRefresh}`,
//         grant_type: "refresh_token",
//       },
//     })
//     .then(async (res) => {
//       if(res.status === 200) {

//       }
//     })
//     .catch((err) => {
//       console.log("Log Out!");
//     });

export default jwtMiddleware;
