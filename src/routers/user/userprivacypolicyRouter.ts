import { Router, Request, Response } from "express";
import { errorResponse, successResponse } from "../../helpers/serverResponse";

const userprivacypolicyRouter = Router();

userprivacypolicyRouter.get("/", getprivacypolicyHandler);

export default userprivacypolicyRouter;

async function getprivacypolicyHandler(req: Request, res: Response) {
  try {
    // const privacypolicy = aw
    successResponse(res, "successfully");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
