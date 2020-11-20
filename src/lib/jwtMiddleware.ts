/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import axios from "axios";
import { Token, decoded } from "../entity/token";
import { Repository, getManager, AdvancedConsoleLogger } from "typeorm";

//token check url
const CHECK_TOKEN_KAKAO = "https://kapi.kakao.com/v1/user/access_token_info";
const CHECK_TOKEN_NAVER = "https://openapi.naver.com/v1/nid/verify";

//token refresh url
const GENERATE_TOKEN_KAKAO = "https://kauth.kakao.com/oauth/token";
const GENERATE_TOKEM_NAVER = "https://nid.naver.com/oauth2.0/token";

const jwtMiddleware = async (ctx: BaseContext, next: any) => {
  const tokenRepository: Repository<Token> = getManager().getRepository(Token);

  const token: Token[] = await tokenRepository.find();
  if (!token) return next();

  try {
    token.map(async (cur, index) => {
      const now = Math.floor(Date.now() / 1000);
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
                const resultToken = res;
                console.log(resultToken);
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
                console.log(resultToken);
              });
          } else if (err.response.data.code === -2) {
            console.error("TypeError: token info is wrong");
          } else if (err.response.data.code === -1) {
            console.error("Internel Server Error in Kakao");
          }
          console.error(err.response.data);
        }
      } else if (cur.tokenProvider === "naver") {
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
              });
          }
        }
      }
    });
    return next();
  } catch (err) {
    return next();
  }
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
