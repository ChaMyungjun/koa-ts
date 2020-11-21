import { BaseContext } from "koa";
import { getManager, Repository, Not, Equal, Like } from "typeorm";
import {
  request,
  summary,
  path,
  body,
  responsesAll,
  tagsAll,
} from "koa-swagger-decorator";
import { Company } from "../entity/company";
import { User } from "../entity/user";
import { IsEmail, validate, ValidationError } from "class-validator";

@responsesAll({
  200: { description: "success" },
  400: { description: "bad request" },
  401: { description: "unauthorized, missing/wrong jwt token" },
})
@tagsAll(["Company"])
export default class CompanyController {
  @request("get", "/companys")
  @summary("Find all companyInfo")
  public static async createCompany(ctx: BaseContext): Promise<void> {
    const companyRepsitory: Repository<Company> = getManager().getRepository(
      Company
    );
    const companyToBeSaved: Company = new Company();

    const errors: ValidationError[] = await validate(companyToBeSaved);

    companyToBeSaved.name = ctx.request.body.name;
    companyToBeSaved.email = ctx.request.body.email;
    companyToBeSaved.position = ctx.request.body.position;
    companyToBeSaved.phone = ctx.request.body.phone;
    companyToBeSaved.image = ctx.request.body.image;

    if (errors.length > 0) {
      ctx.status = 400;
      ctx.body = errors;
      //comapny db in user.email checking
    } else if (!(await companyRepsitory.find({ relations: ["user"] }))) {
      ctx.status = 400;
      ctx.body = "Cannot find user";
    } else {
      const company = await companyRepsitory.save(companyToBeSaved);
      console.log(company);

      ctx.status = 201;
      ctx.body = company;
    }
  }
}
