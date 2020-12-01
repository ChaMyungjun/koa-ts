/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SwaggerRouter } from "koa-swagger-decorator";
import { user, company, payment, token, jwt } from "./controller";

const protectedRouter = new SwaggerRouter();

//naver user data
let naverUser: any = {};

// USER ROUTES
protectedRouter.get("/users", user.getUsers); //All Member find
protectedRouter.post("/user/login", user.getUser); //Login
protectedRouter.post("/user/register", user.createUser); //register
protectedRouter.put("/user/modify", user.updateUser); //modify
protectedRouter.delete("/users/:id", user.deleteUser); //specified member delete
protectedRouter.delete("/testusers", user.deleteTestUsers); // All member delete
protectedRouter.post("/user/logout", user.logoutUser); //user logout
// social logout
// delete token in db
protectedRouter.post("/user/logout", user.logoutUser);

// getting token
protectedRouter.post("/convert/token", token.getSocialToken);

//company data getting
protectedRouter.post("/company/register", company.createCompany);

//comapany data modify
protectedRouter.patch("/company/modify", company.modifyCompany);

//Payment ROUTES
protectedRouter.post("/payment/create", payment.createPaymentInfo);

//norml payment
protectedRouter.post("/payment/normal", payment.normalPayment);

//booked payment
protectedRouter.post("/payment/bookd", payment.bookedPayment);

//jwt Middleware
protectedRouter.post("/jwt/check", jwt.regenerateToken);

// passport.use(
//   "naver-login",
//   new naverStrategy(
//     {
//       clientID: process.env.naver_rest_api,
//       clientSecret: process.env.naver_secret_key,
//       callbackURL: process.env.naver_redirect_url,
//     },
//     (accessToken: any, refreshToken: any, profile: any, done: any) => {
//       naverUser = {
//         access_token: accessToken,
//         refresh_token: refreshToken,
//         profile: profile,
//         backend: "naver",
//       };
//       console.log(profile);
//     }
//   )
// );

// protectedRouter.post(
//   "/convert/token/naver",
//   passport.authenticate("naver-login"),
//   (ctx, next) => {
//     console.log(naverUser);
//     ctx.body = naverUser;
//     ctx.status = 200;
//   }
// );

// protectedRouter.post(
//   "/",
//   passport.authenticate("naver-login", {
//     successRedirect: "/",
//     failureFlash: "/user/login",
//   })
// );

// // Swagger endpoint
// protectedRouter.swagger({
//   title: "node-typescript-koa-rest",
//   description:
//     "API REST using NodeJS and KOA framework, typescript. TypeORM for SQL with class-validators. Middlewares JWT, CORS, Winston Logger.",
//   version: "1.5.0",
// });

// mapDir will scan the input dir, and mautomatically call router.map to all Router Class
protectedRouter.mapDir(__dirname);

export { protectedRouter };
