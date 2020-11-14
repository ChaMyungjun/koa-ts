import { BaseContext } from "koa";
import { description, request, summary, tagsAll } from "koa-swagger-decorator";

@tagsAll(["General"])
export default class TestController {

    @request("get", "/test")
    @summary("Test page")
    @description("A simple welcome message to verify the service is up and running.")
    public static async testing(ctx: BaseContext): Promise<void> {
        ctx.body = "testing";
    }

}