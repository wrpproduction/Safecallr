import { getExpressApp } from "../server.js";

export default async function handler(req: any, res: any) {
  const app = await getExpressApp();
  return app(req, res);
}
