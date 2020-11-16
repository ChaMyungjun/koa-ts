import Koa from "koa";
import jwt from "koa-jwt";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import cors from "@koa/cors";
import winston from "winston";
import { createConnection } from "typeorm";
import "reflect-metadata";
import AdminBro from "admin-bro";
import { buildRouter } from "@admin-bro/koa";
import { Database, Resource } from "@admin-bro/typeorm";

import { User } from "./entity/user";

import { logger } from "./logger";
import { config } from "./config";
import { unprotectedRouter } from "./unprotectedRoutes";
import { protectedRouter } from "./protectedRoutes";
import { cron } from "./cron";
import { validate } from "class-validator";

Resource.validate = validate;
AdminBro.registerAdapter({ Database, Resource });

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

      //appyling connection to model
      User.useConnection(connection);

      //adminBro create
      const adminBro = new AdminBro({
        resources: [
          {
            resource: User,
            options: {
              properties: {
                name: {
                  isVisible: {
                    list: true,
                    filter: true,
                    show: true,
                    edit: true,
                  },
                },
              },
            },
          },
        ],
        branding: {
          companyName: "bibli",
        },
      });

      //adminbor-koa buildRouter setting
      const router = buildRouter(adminBro, app);

      app.use(router.routes());
      app.use(router.allowedMethods());

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
      app.use(
        jwt({ secret: config.jwtSecret }).unless({ path: [/^\/swagger-/] })
      );

      // Register cron job to do any action needed
      cron.start();

      app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
      });
    })
    .catch((error: string) => console.log("TypeORM connection error: ", error));
} catch (e) {
  console.error(e);
}
