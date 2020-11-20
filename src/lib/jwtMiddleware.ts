/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseContext } from "koa";
import jwt from "jsonwebtoken";
import {
  Token,
  tokenSchema,
  encoded,
  reencoded,
  decoded,
} from "../entity/token";
import { Repository, getManager } from "typeorm";

const jwtMiddleware = async (ctx: BaseContext, next: any) => {
  console.log("called");
  console.log(ctx.status);

  const tokenRepository: Repository<Token> = getManager().getRepository(Token);

  const token: Token[] = await tokenRepository.find();
  if (!token) return next();

  try {
    token.map((cur, index) => {
      if (cur.tokenProvider === "kakao") {
        //function()
        console.log(cur.token);
        ctx.body = cur.token;
      }
    });
  } catch (err) {
    console.error(err);
  }
};

export default jwtMiddleware;

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
