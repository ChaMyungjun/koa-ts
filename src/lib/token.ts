/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolve } from "dns";
import jwt from "jsonwebtoken";

const jwtKey = process.env.JWT_SECRET;

//generate token
function generateToken(payload: any) {
  return new Promise((resolve: any, reject: any) => {
    jwt.sign(
      payload,
      jwtKey,
      {
        expiresIn: "7d", // token expired 7d
      },
      (error, token) => {
        if (error) reject(error);
        resolve(token);
      }
    );
  });
}

//decode token
function decorateToken(token: any) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtKey, (err: any, decoded: any) => {
      if (err) {
        reject(err);
      }
      resolve(decoded);
    });
  });
}

exports.jwtMiddleware = async (ctx: any, next: any) => {
  //token exists checking
  const token = ctx.cookies.get("access_token");
  if (!token) return next();

  try {
    const decoded = await decorateToken(token);

    if (Date.now() / 1000 - decoded.exp > 60 * 60 * 24) {
      //one data after
    }
  } catch (e) {
    console.log(e);
  }
};
