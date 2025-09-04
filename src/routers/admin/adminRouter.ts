import { Router } from "express";
import adminappointmentRouter from "./adminappointmentRouter";

const adminRouter = Router();

adminRouter.use("/appointment", adminappointmentRouter);

export default adminRouter;
