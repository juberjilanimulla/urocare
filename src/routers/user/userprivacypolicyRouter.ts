import { Router, Request, Response } from "express";
import { errorResponse, successResponse } from "../../helpers/serverResponse";
import privacypolicymodel from "../../models/privacypolicymodel";

const userprivacypolicyRouter = Router();

userprivacypolicyRouter.get("/", getprivacypolicyHandler);

export default userprivacypolicyRouter;

async function getprivacypolicyHandler(req: Request, res: Response) {
  try {
    const privacypolicy = await privacypolicymodel.find({});
    successResponse(res, "successfully", privacypolicy);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
