import { getExpressApp } from "../server";

export default async function handler(req: any, res: any) {
  const app = await getExpressApp();
  return app(req, res);
}
