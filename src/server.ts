import express, { Request, Response, NextFunction } from "express";
import { Admin } from "./helpers/helperFunction";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import authRouter from "./routers/auth/authRouter";
import dbConnect from "./config/db";
import config from "./config/config";
import adminRouter from "./routers/admin/adminRouter";
import userRouter from "./routers/user/userRouter";

const app = express();
const port = config.PORT || 5000;

// Configure morgan custom tokens
morgan.token("remote-addr", function (req: Request) {
  return (
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || ""
  );
});

morgan.token("url", (req: Request) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return req.originalUrl || url.pathname;
});

app.use(
  morgan(
    ":remote-addr :method :url :status :res[content-length] - :response-time ms"
  )
);

// middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use(
  cors({
    origin: [
      "https://raoofsurocare.vercel.app",
      "https://api.raoofsurocare.com",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);

// JSON error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({ error: "Invalid JSON input" });
  }
  next(err);
});

// Default error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

// database connection
dbConnect()
  .then(() => {
    Admin();
    app.listen(port, () => {
      console.log(`Server listening at port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Unable to connect to server", error);
  });

export default app;
