// simple test to check if the backend is working in aws lambda
import ServerlessHttp from "serverless-http";
import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/healthcheck", (req, res) => {
  res.status(200);
  res.send({
    message: "Healthcheck passed!",
  });
});

export const handler = ServerlessHttp(app);