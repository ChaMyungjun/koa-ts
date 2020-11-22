/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import axios from "axios";
import { Token, decoded } from "../entity/token";
import {
  Repository,
  getManager,
  AdvancedConsoleLogger,
  Equal,
  Not,
} from "typeorm";
import { decode } from "querystring";
import { networkInterfaces } from "os";

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
      }
    } else {
      next();
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
      }
    }
  });

  // if (!tokenLocal) {
  //   return next();
  // }

  //local log in checking token
  // try {
  //   const decodedLocalToken = decoded(tokenLocal);
  //   console.log(decodedLocalToken);
  //   const now = Math.floor(Date.now() / 1000);

  //   //require refreshToken changing
  //   if (decodedLocalToken.access) {
  //     ctx.cookies.set("access-token", {
  //       maxAge: 1000 * 60 * 60,
  //       httpOnly: true,
  //     });
  //   }
  //   return next();
  // } catch (err) {
  //   console.error(err);
  // }

  // return next();
};

export default jwtMiddleware;

// axios({
//     method: "POST",
//     url: `${CHECK_TOKEN_KAKAO}`,
//     headers: { Authorization: `Bearer ${decodedKakaoToken}` },
//   });

//Sample data(after encoding)
/**
 * 
 * [
  Token {
    index: 7,
    tokenProvider: 'kakao',
    Id: 1535748268,
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJKNkY0OXdObTBZdFF5em5HSG5WWGRGSGx5VWszMndubWxXaWpjQW85ZFJrQUFBRjEzX0Z2YWciLCJpYXQiOjE2MDU3Nzk5NDIsImV4cCI6MTYwNjM4NDc0MiwiaXNzIjoiS29hIiwic3ViIjoidG9rZW4ifQ.2yubtSnxSkCLkRWUg1TbK_3mIxNXZWXFBxIe_941kJ4',
    reToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoIjoiNktkc3BfdlZ0My10Xzhsemd2UFdKZjlvdjlHdm4zZGhOU3JpSmdvOWRSa0FBQUYxM19GdmFRIiwiaWF0IjoxNjA1Nzc5OTQyfQ.x9JfeA03qOAAzbd8QGifAA41ZmOPVhCIFz88YIVA7AY'
  },
  Token {
    index: 8,
    tokenProvider: 'naver',
    Id: 89567170,
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJBQUFBT0ctdVQ4MUpfQVUza1U0b29qRjFObEJnc25EcVRJVk9XMFh5RWZ3QWNLSnVpbmJRelEtRnNRNW9ZaU84T3huZVBUcjNvVFdLTGxkbGt3enlTbUFubGpjIiwiaWF0IjoxNjA1Nzc5OTY1LCJleHAiOjE2MDYzODQ3NjUsImlzcyI6IktvYSIsInN1YiI6InRva2VuIn0.sUX8BRQrMP2hccVVx-slz5RPJOgTuGJLfkbW8TytD14',
    reToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoIjoiQjc3eVI1Rmc3dUhyYjJHd1lsZHVSSUR5OEkzUEtKRkxZUGZ0YVgxY1NpczMyS2puV3FKcEVHZXVZYnNoNGRJM09jSWtpc3ZMc0hScnFSeWMwRUhlU2lzeWdvejJ3SDRCV3o3S2lpOXd1ODVocGdTUXVNMk04UnNyN28wUWN3RlJyRTdTIiwiaWF0IjoxNjA1Nzc5OTY1fQ.YtCjUIn2D5rI8p5mRg1ewwofUMY6D3RBlSMzvN_e0Kg'
  }
]
 * 
 */
