import "dotenv/config";
import express from "express";
import cors from "cors";
import ImageKit from "imagekit";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import llmRouter from "./routes/llmRouter.js";
import chatRouter from "./routes/chatsRouter.js";
import {connectMongo} from "./db/index.js";


const app = express();
connectMongo()
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

const corsOptions = {
  origin:  [`${process.env.CLIENT_URL}`, 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Accel-Buffering',
    "Content-Encoding",
    "Transfer-Encoding"
  ],
  exposedHeaders: [
    'Content-Type',
    'Cache-Control',
    'Connection',
    'X-Accel-Buffering',
    "Content-Encoding",
    "Transfer-Encoding"
  ]
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// healthckeck
app.get("/api/healthcheck", (req, res) => {
  res.send("Server is running");
});


app.use(express.json());


const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});



app.get("/api/upload", (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

app.use("/api/chats",ClerkExpressRequireAuth(),chatRouter); 

app.use("/api/llm",ClerkExpressRequireAuth(), llmRouter); 

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(401).send("Unauthenticated!");
});


export default app;