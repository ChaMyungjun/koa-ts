import { BaseContext } from "koa";
import { Equal, getManager, Not, Repository } from "typeorm";
import { request, summary, responsesAll, tagsAll } from "koa-swagger-decorator";
import { Company } from "../entity/company";
import { validate, ValidationError } from "class-validator";
import { company } from ".";

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
    const companyToBeSaved: Company = new Company();
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

  @request("post", "/company/modify")
  @summary("company info data modiy")
  public static async modifyCompany(ctx: BaseContext): Promise<void> {
    const companyRegistory: Repository<Company> = getManager().getRepository(
      Company
    );

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
    } else if (!(await companyRegistory.findOne(companyToBeUpdated.id))) {
      //check if a company with the specified id exists
      //return a BAD REQUEST status code and error message
      ctx.status = 400;
      ctx.bdoy = errors;
    } else if (
      await companyRegistory.findOne({
        id: Not(Equal(companyToBeUpdated.id)),
        companyName: Not(Equal(companyToBeUpdated.companyName)),
        name: Not(Equal(companyToBeUpdated.name)),
        position: Not(Equal(companyToBeUpdated.position)),
        phone: Not(Equal(companyToBeUpdated.phone)),
        email: Not(Equal(companyToBeUpdated.email)),
        image: Not(Equal(companyToBeUpdated.image))
    })
    ) {
      //reqturn BAD REQUEST status code and value already exists
      ctx.status = 400;
      ctx.body = "The value is already exists";
    } else {
      // save the info contained in the PUT body
      const company = await companyRegistory.save(companyToBeUpdated);

      //return CREATE status code and updated company
      ctx.status = 201;
      ctx.body = company;
    }
  }
}
