/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SwaggerRouter } from "koa-swagger-decorator";
import {
  user,
  company,
  payment,
  token,
  jwt,
  music,
  folder,
  latest,
  musicLike,
} from "./controller";
import { Latest } from "./entity/latest";

const protectedRouter = new SwaggerRouter();

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
protectedRouter.post("/payment/member/create", payment.createPaymentInfo);

//Booking pamynet callback
protectedRouter.get("/payment/callback", payment.callbackPayment);

//norml payment
protectedRouter.post("/payment/order/create", payment.craeteOrder);

//searching normal payment
protectedRouter.post("/payment/order/callback", payment.normalPaymentCallback);

//music collecction
// protectedRouter.post()

//folder create
protectedRouter.post("/music/folder/create", folder.createFolder);

//folder delete
protectedRouter.post("/music/folder/delete", folder.deleteFolder);

//music like save
protectedRouter.post("/music/like/save", musicLike.createMusicLike);

//latest create
protectedRouter.post("/music/latest", latest.saveLatestMusic);

//jwt Middleware
protectedRouter.post("/jwt/check", jwt.regenerateToken);

// // Swagger endpoint
protectedRouter.swagger({
  title: "node-typescript-koa-rest",
  description:
    "API REST using NodeJS and KOA framework, typescript. TypeORM for SQL with class-validators. Middlewares JWT, CORS, Winston Logger.",
  version: "1.5.0",
});

// mapDir will scan the input dir, and mautomatically call router.map to all Router Class
protectedRouter.mapDir(__dirname);

export { protectedRouter };
