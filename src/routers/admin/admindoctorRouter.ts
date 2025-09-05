import { Router, Request, Response } from "express";
import doctormodel, { IDoctor } from "../../models/doctormodel"; // <-- ensure doctormodel.ts exports IDoctor interface
import { errorResponse, successResponse } from "../../helpers/serverResponse";
import { SortOrder, Mongoose } from "mongoose";

const admindoctorRouter = Router();

admindoctorRouter.post("/", getalldoctorHandler);
admindoctorRouter.post("/create", createdoctorHandler);
admindoctorRouter.put("/update", updatedoctorHandler);
admindoctorRouter.delete("/delete", deletedoctorHandler);

export default admindoctorRouter;

async function getalldoctorHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      pageno = 0,
      filterBy = {},
      sortby = {},
      search = "",
    }: {
      pageno?: number;
      filterBy?: Record<string, any>;
      sortby?: Record<string, "asc" | "desc">;
      search?: string;
    } = req.body;

    const limit = 10;
    const skip = pageno * limit;

    let query: any = { $and: [] };

    // Apply filters
    if (filterBy && Object.keys(filterBy).length > 0) {
      Object.keys(filterBy).forEach((key) => {
        if (filterBy[key] !== undefined) {
          query.$and.push({ [key]: filterBy[key] });
        }
      });
    }

    // Apply search
    if (search.trim()) {
      const searchRegex = new RegExp("\\b" + search.trim(), "i");
      const searchConditions = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { mobile: { $regex: searchRegex } },
      ];
      query.$and.push({ $or: searchConditions });
    }

    if (query.$and.length === 0) {
      query = {};
    }

    // Sorting logic
    const sortBy: Record<string, SortOrder> =
      Object.keys(sortby).length !== 0
        ? Object.keys(sortby).reduce<Record<string, SortOrder>>((acc, key) => {
            acc[key] = sortby[key] === "asc" ? 1 : -1;
            return acc;
          }, {})
        : { createdAt: -1 };

    const doctor: IDoctor[] = await doctormodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await doctormodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "Success", { doctor, totalPages });
  } catch (error) {
    console.error("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createdoctorHandler(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, mobile, specialization } = req.body;

    if (!name || !email || !mobile) {
      errorResponse(res, 400, "some params are missing");
      return;
    }

    const doctor = await doctormodel.create({
      name,
      email,
      mobile,
      specialization,
    });

    successResponse(res, "success", doctor);
  } catch (error) {
    console.error("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updatedoctorHandler(req: Request, res: Response): Promise<void> {
  try {
    const { _id, ...updatedData } = req.body;

    if (!_id) {
      errorResponse(res, 400, "doctor ID (_id) is required");
      return;
    }

    const existingdoctor = await doctormodel.findById(_id);
    if (!existingdoctor) {
      errorResponse(res, 404, "doctor does not exist");
      return;
    }

    if (!updatedData.name || !updatedData.email || !updatedData.mobile) {
      errorResponse(res, 400, "Some params are missing");
      return;
    }

    const doctor = await doctormodel.findByIdAndUpdate(_id, updatedData, {
      new: true,
    });

    successResponse(res, "successfully updated", doctor);
  } catch (error) {
    console.error("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletedoctorHandler(req: Request, res: Response): Promise<void> {
  try {
    const { _id } = req.body;

    if (!_id) {
      errorResponse(res, 400, "some params are missing");
      return;
    }

    const checkexist = await doctormodel.findById(_id);
    if (!checkexist) {
      errorResponse(res, 404, "doctor not found in database");
      return;
    }

    await doctormodel.findByIdAndDelete(_id);

    successResponse(res, "successfully deleted");
  } catch (error) {
    console.error("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
