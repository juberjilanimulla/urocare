import { Router } from "express";
import userappointmentRouter from "./userappointmentRouter";
import userpaymentRouter from "./userpaymentRouter";
import userdoctorRouter from "./userdoctorRouter";
import userslotbookingRouter from "./userslotbookingRouter";

const userRouter = Router();

userRouter.use("/appointment", userappointmentRouter);
userRouter.use("/payment", userpaymentRouter);
userRouter.use("/doctor", userdoctorRouter);
userRouter.use("/slotbooking", userslotbookingRouter);

export default userRouter;
