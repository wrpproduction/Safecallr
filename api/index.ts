import { getExpressApp } from "../server.ts";

export default async function handler(req: any, res: any) {
  const app = await getExpressApp();
  return app(req, res);
}
