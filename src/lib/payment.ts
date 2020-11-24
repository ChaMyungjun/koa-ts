import { Iamport, Request, Enum } from "iamport-rest-client-nodejs";

export async function IamportPayment() {
  console.log("Payment testing");

  const { Banks } = Request;
  const { BankCodeEnum } = Enum;

  const apikey = process.env.iamporter_api_key;
  const secret = process.env.iamporter_api_secret;

  const iamporter = new Iamport({
    apiKey: apikey,
    apiSecret: secret,
  });

  //Parsing all banks
  const getBanks = Banks.getBanks();
  getBanks
    .request(iamporter)
    .then((response) => console.log("response: ", response.data));

  //Parsing specified banks
  const getBank = Banks.getBank({
    code: BankCodeEnum.SC,
  });
  await getBank
    .request(iamporter)
    .then((response) => console.log("response: ", response.data))
    .catch((err) => console.log("error: ", err.response.data));
}
