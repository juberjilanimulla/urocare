import { Router, Request, Response } from "express";
import { errorResponse } from "../../helpers/serverResponse";
import { successResponse } from "../../helpers/serverResponse";

const admindashboardRouter = Router();

admindashboardRouter.post("/getallpatient", getdashboardpatientHandler);
admindashboardRouter.post("/getallpayment", getallpatientHandler);
export default admindashboardRouter;

async function getdashboardpatientHandler(req: Request, res: Response) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "Internal server error");
  }
}

async function getallpatientHandler(req: Request, res: Response) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "Internal server error");
  }
}
