import { Router } from "express";
import userappointmentRouter from "./userappointmentRouter";
import userpaymentRouter from "./userpaymentRouter";

const userRouter = Router();

userRouter.use("/appointment", userappointmentRouter);
userRouter.use("/payment", userpaymentRouter);

export default userRouter;
