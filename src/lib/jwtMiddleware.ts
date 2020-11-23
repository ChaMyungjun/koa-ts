/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import axios from "axios";
import { Token, decoded } from "../entity/token";
import { Repository, getManager, Equal, Not } from "typeorm";

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
      try {
        if (decodedLocalToken.exp - now < 60 * 40) {
          tokenRepository.findOne({
            Id: Not(Equal(tokenSocial[index].Id)),
            token: decodedLocalRefreshToken,
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
            const resultToken = res;
            console.log(resultToken.data);
            if (resultToken.data) {
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
            .then((res) => {
              //token value exsisting
              if (res.data.access_token) {
                tokenRepository.findOne({
                  tokenProvider: Not(Equal(tokenSocial[index].tokenProvider)),
                  Id: Not(Equal(tokenSocial[index].Id)),
                  token: res.data.access_token,
                  reToken: Not(Equal(tokenSocial[index].reToken)),
                });
              }
            })
            .catch((err) => {
              console.error(err);
              console.log("Expired");
            });
        } else if (decodedKakaoToken.exp - now < 60 * 40) {
          const decodedKakaoRefresh = decoded(cur.reToken);
          await axios
            .get(`${GENERATE_TOKEN_KAKAO}`, {
              params: {
                grant_type: "refresh_token",
                client_id: `${process.env.kakao_rest_api}`,
                refresh_token: `${decodedKakaoRefresh.access}`,
              },
            })
            .then((res) => {
              const resultToken = res;
              console.log(res);

              //access-token re encoding
              // await tokenRepository.findOne({
              //   token: resultToken.access_token;
              // })
            })
            .catch((err) => {
              console.log("Expired");
            });
        } else if (err.response.data.code === -2) {
          console.error("TypeError: token info is wrong");
        } else if (err.response.data.code === -1) {
          console.error("Internel Server Error in Kakao");
        }
        console.error(err.response.data);
        console.log(err);
        return next();
      }
    }

    //naver token checking
    if (cur.tokenProvider === "naver") {
      const decodedNaverToken = decoded(cur.token);
      try {
        //   console.log(decodedNaverToken);
        await axios
          .get(`${CHECK_TOKEN_NAVER}`, {
            headers: { Authorization: `Bearer ${decodedNaverToken.access}` },
          })
          .then((res) => {
            const resultToken = res;
            console.log(resultToken.data);
          });
        return next();
      } catch (err) {
        if (err.response.data.resultcode === "024") {
          console.error(err.response.data.message);
        } else if (decodedNaverToken.exp - now < 60 * 40) {
          const decodedNaverRefresh = decoded(cur.reToken);
          await axios
            .get(`${GENERATE_TOKEM_NAVER}`, {
              params: {
                client_id: `${process.env.naver_rest_api}`,
                client_secret: `${process.env.naver_secret_key}`,
                refresh_token: `${decodedNaverToken}`,
                grant_type: "refresh_token",
              },
            })
            .then((res) => {
              const resultToken = res;

              console.log(resultToken);
            })
            .catch((err) => {
              console.log("Expired");
              ctx.redirect("/naver/login");
            });
        }
        console.log(err);
        return next();
      }
    }
  });
  return next();
};

export default jwtMiddleware;
