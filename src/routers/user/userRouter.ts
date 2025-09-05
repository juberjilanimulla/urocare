import { Router } from "express";
import userappointmentRouter from "./userappointmentRouter";
import userpaymentRouter from "./userpaymentRouter";
import userdoctorRouter from "./userdoctorRouter";

const userRouter = Router();

userRouter.use("/appointment", userappointmentRouter);
userRouter.use("/payment", userpaymentRouter);
userRouter.use("/doctor", userdoctorRouter);

export default userRouter;
