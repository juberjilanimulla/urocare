import { Router, Request, Response } from "express";
import patientmodel from "../../models/patientmodel";
import { successResponse, errorResponse } from "../../helpers/serverResponse";

const adminpatientRouter = Router();

adminpatientRouter.post("/create", createpatientHandler);

export default adminpatientRouter;

async function createpatientHandler(req: Request, res: Response) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
