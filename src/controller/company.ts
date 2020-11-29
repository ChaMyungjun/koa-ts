import { BaseContext } from "koa";
import { Equal, getManager, Not, Repository } from "typeorm";
import { request, summary, responsesAll, tagsAll } from "koa-swagger-decorator";
import { validate, ValidationError } from "class-validator";

import { Company } from "../entity/company";
import { User } from "../entity/user";
import { Token } from "../entity/token";

@responsesAll({
  200: { description: "success" },
  400: { description: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["Company"])
export default class CompanyController {
  @request("post", "/company/register")
  @summary("create company info data")
  public static async createCompany(ctx: BaseContext): Promise<void> {
    const companyRepsitory: Repository<Company> = getManager().getRepository(
      Company
    );
    const userRepository: Repository<User> = getManager().getRepository(User);
    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );
    const gottenToken = ctx.cookies.get("access_token");
    const userToBeUpdate = await userRepository.findOne({
      token: await tokenRepository.findOne({ token: gottenToken }),
    });

    if (userToBeUpdate) {
      const companyToBeSaved: Company = new Company();

      companyToBeSaved.companyName = ctx.request.companyName;
      companyToBeSaved.name = ctx.request.body.name;
      companyToBeSaved.email = ctx.request.body.email;
      companyToBeSaved.position = ctx.request.body.position;
      companyToBeSaved.phone = ctx.request.body.phone;
      companyToBeSaved.image = ctx.request.body.image;

      const errors: ValidationError[] = await validate(companyToBeSaved);

      if (errors.length > 0) {
        ctx.status = 400;
        ctx.body = errors;
        //comapny db in user.email checking
      } else if (
        await companyRepsitory.findOne({
          companyName: companyToBeSaved.companyName,
        })
      ) {
        ctx.status = 400;
        ctx.body = "CompanyName already exists";
      } else {
        await companyRepsitory.save(companyToBeSaved);
        await userRepository.update(userToBeUpdate.index, {
          company: companyToBeSaved,
        });
        ctx.status = 201;
      }
    }
  }

  @request("patch", "/company/modify")
  @summary("company info data modiy")
  public static async modifyCompany(ctx: BaseContext): Promise<void> {
    const companyRepository: Repository<Company> = getManager().getRepository(
      Company
    );
    const userRepository: Repository<User> = getManager().getRepository(User);
    const tokenRepository: Repository<Token> = getManager().getRepository(
      Token
    );

    const gottenToken = ctx.cookies.get("access_token");
    const userToBeUpdate = await userRepository.findOne({
      token: await tokenRepository.findOne({ token: gottenToken }),
    });

    if (userToBeUpdate) {
      const companyToBeUpdated: Company = new Company();
      companyToBeUpdated.companyName = ctx.request.body.companyName;
      companyToBeUpdated.name = ctx.request.body.name;
      companyToBeUpdated.position = ctx.request.body.position;
      companyToBeUpdated.phone = ctx.request.body.request;
      companyToBeUpdated.email = ctx.request.body.email;
      companyToBeUpdated.image = ctx.request.body.image;

      const errors: ValidationError[] = await validate(companyToBeUpdated);

      if (errors.length > 0) {
        ctx.status = 400;
        ctx.body = errors;
      } else if (await companyRepository.findOne(companyToBeUpdated.index)) {
        //check if a company with the specified id exists
        //return a BAD REQUEST status code and error message
        ctx.status = 400;
        ctx.bdoy = "Error!";
      } else {
        // save the info contained in the PUT body
        const company = await companyRepository.save(companyToBeUpdated);
        //return CREATE status code and updated company
        ctx.status = 201;
        ctx.body = company;
      }
    }
  }
}
