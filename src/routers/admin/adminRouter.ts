import { Router } from "express";
import adminappointmentRouter from "./adminappointmentRouter";
import adminpaymentRouter from "./adminpaymentRouter";
import adminslotbookingRouter from "./adminslotbookingRouter";
import admindoctorRouter from "./admindoctorRouter";

const adminRouter = Router();

adminRouter.use("/appointment", adminappointmentRouter);
adminRouter.use("/payment", adminpaymentRouter);
adminRouter.use("/slotbooking", adminslotbookingRouter);
adminRouter.use("/doctor", admindoctorRouter);
export default adminRouter;
