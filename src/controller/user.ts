/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/camelcase */
import { BaseContext } from "koa";
import { getManager, Repository, Like } from "typeorm";
import { validate, ValidationError } from "class-validator";
import {
  request,
  summary,
  path,
  body,
  responsesAll,
  tagsAll,
} from "koa-swagger-decorator";
import {
  User,
  userSchema,
  hashedPassword,
  comparePassword,
  generateToken,
  generateRefresh,
} from "../entity/user";

import { Token } from "../entity/token";
import { Company } from "../entity/company";
//import { Company } from "src/entity/company";

@responsesAll({
  200: { description: "success" },
  400: { description: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["User"])
export default class UserController {
  @request("get", "/users")
  @summary("Find all users")
  public static async getUsers(ctx: BaseContext): Promise<void> {
    // get a user repository to perform operations with user
    const userRepository: Repository<User> = getManager().getRepository(User);

    // load all users
    const users: User[] = await userRepository.find();

    // return OK status code and loaded users array
    ctx.status = 200;
    ctx.body = users;
  }

  //Login => /login/local
  @request("post", "/user/login")
  @summary("Find user by id")
  @path({
    email: { type: "string", required: true, description: "email of user" },
    passowrd: {
      type: "string",
      required: true,
      description: "password of user",
    },
  })
  public static async getUser(ctx: BaseContext): Promise<void> {
    // get a user repository to perform operations with user
    const userRepository: Repository<User> = getManager().getRepository(User);

    //get a token repsitory to perform operations with token
    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );

    //first checking email and then password checking
    // load user by email
    //email value checking
    const name = ctx.request.body.email;
    const password = ctx.request.body.password;

    const findUser: User | undefined = await userRepository.findOne({
      email: name,
    });

    if (findUser) {
      console.log(findUser);

      const tokenToBeSaved: Token = new Token();

      const errors: ValidationError[] = await validate(tokenToBeSaved);

      //Generate token
      const access_token = generateToken();

      const refresh_token = generateRefresh();
      const expires_in = 60 * 60 * 24;

      //email checking
      //password hashed checking
      if (comparePassword(findUser.password, password)) {
        // return OK status code and loaded user object
        //save token token db
        tokenToBeSaved.Id = findUser.index;
        tokenToBeSaved.token = access_token;
        tokenToBeSaved.reToken = refresh_token;
        tokenToBeSaved.tokenProvider = "local";

        if (errors.length > 0) {
          ctx.status = 400;
        } else {
          await tokenRepository.save(tokenToBeSaved);
          const user = await userRepository.update(findUser.index, {
            token: tokenToBeSaved,
          });
          const name = findUser.name;

          console.log(user);

          ctx.status = 200;
          ctx.body = {
            access_token,
            refresh_token,
            expires_in,
            user: { name },
          };
        }
      }
    } else {
      // return a Forbbin status code and error message
      ctx.status = 403;
      ctx.body = "The user you are trying to retrieve doesn't exist in the db";
    }
  }

  //Sign Up => /register/local
  @request("post", "/users/register")
  @summary("Create a user")
  @body(userSchema)
  public static async createUser(ctx: BaseContext): Promise<void> {
    // get a user repository to perform operations with user
    const userRepository: Repository<User> = getManager().getRepository(User);

    //create enetity
    //build up entity user to be saved
    //특수기호 포함 6자 이상
    const userToBeSaved: User = new User();
    userToBeSaved.name = ctx.request.body.name;
    userToBeSaved.email = ctx.request.body.email;
    userToBeSaved.password = await hashedPassword(ctx.request.body.password);
    // validate user entity
    const errors: ValidationError[] = await validate(userToBeSaved); // errors is an array of validation errors

    // const refreshToken = generateRefresh(
    //   userToBeSaved.name,
    //   userToBeSaved.email
    // );

    //Error Checking
    if (errors.length > 0) {
      // return BAD REQUEST status code and errors array
      ctx.status = 400;
      ctx.body = errors;
    } else if (await userRepository.findOne({ email: userToBeSaved.email })) {
      //Email exists checking
      // return BAD REQUEST status code and email already exists error
      ctx.status = 400;
      ctx.body = {
        email: "The specified e-mail address already exists",
        name: null,
      };
    } else if (ctx.request.body.password.length < 6) {
      //password length checking
      // return BAD REQUEST status code and password does not matched error
      ctx.status = 400;
      ctx.body = "The specified password length does not matched";
    } else if (
      ctx.request.body.password.search(/[`~!@@#$%^&*, | \\\\";:\/?`]/gi) < 0 //password special character checking
    ) {
      ctx.status = 400;
      ctx.body = "The specified password does not exists special character";
    } else if (await userRepository.findOne({ name: userToBeSaved.name })) {
      //username exists checking
      //return BAD REQUEST status code and name already exists error
      ctx.status = 400;
      ctx.body = { name: "The specified name already exists", email: null };
    } else {
      // save the user contained in the POST body
      await userRepository.save(userToBeSaved);
      // return CREATED status code and updated user
      ctx.status = 201;
    }
  }

  //Modify User info
  @request("put", "/user/modify")
  @summary("Update a user")
  @path({
    id: { type: "number", required: true, description: "id of user" },
  })
  @body(userSchema)
  public static async updateUser(ctx: BaseContext): Promise<void> {
    // get a user repository to perform operations with user
    const userRepository: Repository<User> = getManager().getRepository(User);
    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    //const companyRepositoyry: Repository<Company> = getManager().getRepository(Company);
    const gottenToken = ctx.request.header.authorization.split(" ")[1];
    const userToBeUpdate = await userRepository.findOne({
      token: await tokenRepository.findOne({ token: gottenToken }),
    });
    if (userToBeUpdate) {
      await userRepository.update(userToBeUpdate.index, {
        email: ctx.request.body.email,
        password: await hashedPassword(ctx.request.body.password),
      });

      ctx.body = "Modify Success";
      ctx.redirect("/");
      ctx.status = 201;
    } else {
      ctx.status = 403;
      ctx.body = "AccessDenied";
    }

    // update the user by specified id
    // build up entity user to be updated
    // const userToBeUpdated: User = new User();
    // userToBeUpdated.index = +ctx.params.index || 0; // will always have a number, this will avoid errors
    // userToBeUpdated.email = ctx.request.body.email;
    // userToBeUpdated.password = await hashedPassword(ctx.request.body.password);

    // validate user entity
    // const errors: ValidationError[] = await validate(userToBeUpdated); // errors is an array of validation errors

    // if (errors.length > 0) {
    //   // return BAD REQUEST status code and errors array
    //   ctx.status = 400;
    //   ctx.body = errors;
    // } else if (await userRepository.findOne(userToBeUpdated.index)) {
    //   // check if a user with the specified id exists
    //   // return a BAD REQUEST status code and error message
    //   ctx.status = 400;
    //   ctx.body = "The user you are trying to update doesn't exist in the db";
    // } else if (ctx.request.body.password !== ctx.request.body.passwordConfirm) {
    //   //password matching checking
    //   ctx.status = 400;
    //   ctx.body = "The specified password doesn't matched";
    // } else {
    //   // save the user contained in the PUT body
    //   await userRepository.update()
    //   // return CREATED status code and updated user
    //   ctx.status = 201;
    //   ctx.body = user;
    // }
  }

  //{id}User delete the info
  @request("delete", "/users/{index}")
  @summary("Delete user by index")
  @path({
    id: { type: "number", required: true, description: "id of user" },
  })
  public static async deleteUser(ctx: BaseContext): Promise<void> {
    // get a user repository to perform operations with user
    const userRepository = getManager().getRepository(User);

    // find the user by specified id
    const userToRemove: User | undefined = await userRepository.findOne(
      +ctx.params.index || 0
    );
    if (!userToRemove) {
      // return a BAD REQUEST status code and error message
      ctx.status = 400;
      ctx.body = "The user you are trying to delete doesn't exist in the db";
    } else if (ctx.state.user.email !== userToRemove.email) {
      // check user's token id and user id are the same
      // if not, return a FORBIDDEN status code and error message
      ctx.status = 403;
      ctx.body = "A user can only be deleted by himself";
    } else {
      // the user is there so can be removed
      await userRepository.remove(userToRemove);
      // return a NO CONTENT status code
      ctx.status = 204;
    }
  }

  //All User delete the info
  @request("delete", "/testusers")
  @summary("Delete users generated by integration and load tests")
  public static async deleteTestUsers(ctx: BaseContext): Promise<void> {
    // get a user repository to perform operations with user
    const userRepository = getManager().getRepository(User);

    // find test users
    const usersToRemove: User[] = await userRepository.find({
      where: { email: Like("%@citest.com") },
    });

    // the user is there so can be removed
    await userRepository.remove(usersToRemove);

    // return a NO CONTENT status code
    ctx.status = 204;
  }

  //local token delete => logout
  @request("post", "/user/logout")
  @summary("Delete user token")
  public static async logoutUser(ctx: BaseContext): Promise<void> {
    console.log(ctx.status);
    console.log("logout");

    //db token delete
  }

  @request("post", "/user/profile")
  @summary("modify user profile")
  public static async userProfile(ctx: BaseContext): Promise<void> {
    const userRepository: Repository<User> = getManager().getRepository(User);
    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const companyRepositoyry: Repository<Company> = getManager().getRepository(
      Company
    );

    const gottentToken = ctx.request.header.authorization.split(" ")[1];

    const findUser = await userRepository.findOne({
      token: await tokenRepository.findOne({ token: gottentToken }),
    });

    if (findUser) {
      const findCompany = await companyRepositoyry.findOne({ user: findUser });
      if (findCompany) {
        const sendingData = {
          id: findUser.index,
          email: findUser.email,
          isSocial: findUser.token.tokenProvider,
          ...findCompany,
        };

        ctx.status = 200;
        ctx.body = sendingData;
      } else {
        const sendingData = {
          id: findUser.index,
          email: findUser.email,
          isSocial: findUser.token.tokenProvider,
        };

        ctx.status = 200;
        ctx.body = sendingData;
      }
    } else {
      ctx.status = 403;
      ctx.body = { error: "token doesn't exists" };
    }
  }
}
