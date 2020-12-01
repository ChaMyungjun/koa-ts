import { BaseContext } from "koa";
import { getManager, Repository } from "typeorm";
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
      
      companyToBeSaved.companyName = ctx.request.company;
      companyToBeSaved.name = ctx.request.body.name;
      companyToBeSaved.email = ctx.request.body.email;
      companyToBeSaved.position = ctx.request.body.position;
      companyToBeSaved.phone = ctx.request.body.phone;
      companyToBeSaved.image = ctx.request.body.business.path;

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
      await companyRepository.update(userToBeUpdate.index, {
        companyName: ctx.request.body.companyName,
        name: ctx.request.body.name,
        email: ctx.request.body.email,
        position: ctx.request.body.position,
        phone: ctx.request.body.phone,
        image: ctx.request.body.phone,
      });

      ctx.body = "Modify Success";
      ctx.redirect("/");
      ctx.status = 201;
    } else {
      ctx.status = 403;
      ctx.body = "AccessBody";
    }
  }
}
