import { Router, Request, Response } from "express";
import { errorResponse, successResponse } from "../../helpers/serverResponse";
import appointmentmodel from "../../models/appointmentmodel";
import { Types, SortOrder } from "mongoose";

const adminappointmentRouter = Router();

adminappointmentRouter.post("/getall", getallappointmentHandler);
adminappointmentRouter.delete("/delete", deleteappointmentHandler);

export default adminappointmentRouter;

// Types for filter & sort
interface FilterBy {
  [key: string]: any;
  startDate?: string;
  endDate?: string;
}

interface SortBy {
  [key: string]: "asc" | "desc";
}

// -------------------- HANDLERS -------------------- //

async function getallappointmentHandler(req: Request, res: Response) {
  try {
    const {
      pageno = 0,
      filterBy = {},
      sortby = {},
      search = "",
    }: {
      pageno?: number;
      filterBy?: FilterBy;
      sortby?: SortBy;
      search?: string;
    } = req.body;

    const limit = 10;
    const skip = pageno * limit;

    let query: any = { $and: [] };

    // Apply filters
    if (filterBy) {
      Object.keys(filterBy).forEach((key) => {
        if (
          filterBy[key] !== undefined &&
          key !== "startDate" &&
          key !== "endDate"
        ) {
          query.$and.push({ [key]: filterBy[key] });
        }
      });
    }

    // Date filter
    if (filterBy.startDate && filterBy.endDate) {
      query.$and.push({
        date: {
          $gte: new Date(filterBy.startDate),
          $lte: new Date(filterBy.endDate),
        },
      });
    }

    // Apply search
    if (search.trim()) {
      const searchRegex = new RegExp("\\b" + search.trim(), "i");
      const searchConditions = [
        { patientname: { $regex: searchRegex } },
        { patientemail: { $regex: searchRegex } },
        { patientmobile: { $regex: searchRegex } },
      ];
      query.$and.push({ $or: searchConditions });
    }

    if (query.$and.length === 0) {
      query = {};
    }

    // Sorting
    const sortBy: Record<string, SortOrder> =
      Object.keys(sortby).length !== 0
        ? Object.keys(sortby).reduce<Record<string, SortOrder>>((acc, key) => {
            acc[key] = sortby[key] === "asc" ? 1 : -1;
            return acc;
          }, {})
        : { createdAt: -1 };

    // Query with pagination
    const appointment = await appointmentmodel
      .find(query)
      .populate("doctorid", "name specialization")
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    // Pagination count
    const totalCount = await appointmentmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "Success", { appointment, totalPages });
  } catch (error) {
    console.error("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deleteappointmentHandler(req: Request, res: Response) {
  try {
    const { appointmentid }: { appointmentid?: string } = req.body;

    if (!appointmentid || !Types.ObjectId.isValid(appointmentid)) {
      return errorResponse(res, 400, "Invalid or missing appointmentid");
    }

    await appointmentmodel.findByIdAndDelete({ _id: appointmentid });

    return successResponse(res, "Successfully deleted");
  } catch (error) {
    console.error("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
