/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import cors from "@koa/cors";
import winston from "winston";
import passport from "koa-passport";
import { createConnection } from "typeorm";
import "reflect-metadata";
import AdminBro from "admin-bro";
import { buildAuthenticatedRouter, buildRouter } from "@admin-bro/koa";
import { Database, Resource } from "@admin-bro/typeorm";
import { validate } from "class-validator";

import { User } from "./entity/user";
import { Token } from "./entity/token";
import { Company } from "./entity/company";
import { Payment } from "./entity/payment";
import { Admin } from "./entity/admin";

import { logger } from "./logger";
import { config } from "./config";
import { unprotectedRouter } from "./unprotectedRoutes";
import { protectedRouter } from "./protectedRoutes";
import { cron } from "./cron";
import { Member } from "./entity/member";
import { Music } from "./entity/music";
import { Order } from "./entity/order";
import { Collection } from "./entity/collection";
import { Folder } from "./entity/folder";
import { MusicLike } from "./entity/musicLike";
import { Latest } from "./entity/latest";
import { FolderMusic } from "./entity/memo";

Resource.validate = validate;

// create connection with database
// note that its not active database connection
// TypeORM creates you connection pull to uses connections from pull on your requests

try {
  //typeorm connection create
  createConnection({
    type: "postgres",
    url: config.databaseUrl,
    synchronize: true,
    logging: false,
    entities: config.dbEntitiesPath,

    /**
     *SSL error creating( as development setting)
  
     */
    extra: {
      ssl: config.dbsslconn, // if not development, will use SSL
    },
  })
    .then(async (connection) => {
      const app = new Koa();
      app.keys = ["super-secret1", "super-secret2"];

      //user modify setting
      const canModifyUsers = ({ currentAdmin }: any) =>
        currentAdmin && currentAdmin.role === "admin";

      const UserNavigation = {
        name: "User",
        icon: "Accessibility",
      };

      const PaymentNavigation = {
        name: "Payment",
        icon: "Accessibility",
      };

      const MusicNavigation = {
        name: "Music",
        icon: "Accessibility",
      };

      AdminBro.registerAdapter({ Database, Resource });
      //adminBro create
      const adminBro = new AdminBro({
        // dashboard: {
        //   handler: async () => {
        //     return { some: "output" };
        //   },
        //   component: AdminBro.bundle("./my-dashboard-component"),
        // },
        resources: [
          {
            resource: User,
            options: {
              parent: {
                name: "Superintend User",
              },
              navigation: UserNavigation,
            },
            actions: {
              new: {
                edit: {
                  isAccessible: canModifyUsers,
                },
                delete: { isAccessible: canModifyUsers },
                new: { isAccessible: canModifyUsers },
              },
            },
          },
          {
            resource: Token,
            options: {
              parent: {
                name: "Superitend User Token",
              },
              navigation: UserNavigation,
            },
          },
          {
            resource: Company,
            options: {
              parent: {
                name: "Superitend Company",
              },
              navigation: UserNavigation,
            },
          },
          {
            resource: Payment,
            options: {
              parent: {
                name: "Superitend User Payment",
              },
              navigation: PaymentNavigation,
            },
          },
          {
            resource: Member,
            options: {
              parent: {
                name: "Supertiend Member",
              },
              navigation: PaymentNavigation,
            },
          },
          {
            resource: Order,
            options: {
              parent: {
                name: "Supertiend Order",
              },
              navigation: PaymentNavigation,
            },
          },
          {
            resource: Music,
            options: {
              parent: {
                name: "Supertiend Music",
              },
              navigation: MusicNavigation,
            },
          },
          {
            resource: Collection,
            options: {
              parent: {
                name: "Superitend Collection",
              },
              navigation: MusicNavigation,
            },
          },
          {
            resource: Folder,
            options: {
              parent: {
                name: "Superitend Music",
              },
              navigation: MusicNavigation,
            },
          },
          {
            resource: MusicLike,
            options: {
              parent: {
                name: "Superitend Music",
              },
              navigation: MusicNavigation,
            },
          },
          {
            resource: Latest,
            options: {
              parent: {
                name: "Superitend Music",
              },
              navigation: MusicNavigation,
            },
          },
          {
            resource: FolderMusic,
            options: {
              parent: {
                name: "Superitend Music",
              },
              navigation: MusicNavigation,
            },
          },
        ],
        branding: {
          companyName: "BIBILI",
        },
        rootPath: "/admin",
      });

      // const adminBro = new AdminBro({
      //   databases: [],
      //   rootPath: "/admin",
      // });

      //adminbor-koa buildRouter setting
      const router = buildAuthenticatedRouter(adminBro, app, {
        authenticate: async (email, password) => {
          const user = await Admin.findOne({ email });
          if (user) {
            if (password === user.password) {
              return user;
            }
          }
          return null;
        },
      });
      // const router = buildRouter(adminBro, app);

      app.use(router.routes()).use(router.allowedMethods());

      // Provides important security headers to make your app more secure
      app.use(helmet());

      // Enable cors with default options
      app.use(cors());

      // Logger middleware -> use winston as logger (logging.ts with config)
      app.use(logger(winston));

      // Enable bodyParser with default options
      app.use(bodyParser());

      // these routes are NOT protected by the JWT middleware, also include middleware to respond with "Method Not Allowed - 405".
      app
        .use(unprotectedRouter.routes())
        .use(unprotectedRouter.allowedMethods());

      // These routes are protected by the JWT middleware, also include middleware to respond with "Method Not Allowed - 405".
      app.use(protectedRouter.routes()).use(protectedRouter.allowedMethods());

      // JWT middleware -> below this line routes are only reached if JWT token is valid, secret as env variable
      // do not protect swagger-json and swagger-html endpoints
      //passport initialize setting
      app.use(passport.initialize());
      app.use(passport.session());

      // app.use(async (ctx) => {
      //   ctx.isAuthenticated();
      //   ctx.isUnauthenticated();
      //   // await ctx.login();
      //   // ctx.logout();
      //   // ctx.state.user();
      // });

      // Register cron job to do any action needed
      cron.start();

      app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
      });
    })
    .catch((error: string) => console.log("TypeORM connection error: ", error));
} catch (err) {
  console.error(err);
}
