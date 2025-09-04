import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dbConnect from "./config/db";

const app: Application = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("file checking");
});

dbConnect()
  .then(() => {
    app.listen(port, () => {
      console.log(`server is listening at ${port}`);
    });
  })
  .catch((error) => {
    console.log("unable to connected to server", error);
  });
