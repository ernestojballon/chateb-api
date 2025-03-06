import serverlessHttp from "serverless-http";
import app from "./src/app.js";


export const handler = serverlessHttp(app)
