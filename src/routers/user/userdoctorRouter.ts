import { Router, Request, Response } from "express";
import { errorResponse, successResponse } from "../../helpers/serverResponse";
import doctormodel from "../../models/doctormodel";

const userdoctorRouter = Router();

userdoctorRouter.get("/getall", getalldoctorHandler);

export default userdoctorRouter;

async function getalldoctorHandler(req: Request, res: Response) {
  try {
    const doctor = await doctormodel.find({});
    successResponse(res, "success", doctor);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
