import { Router, Request, Response } from "express";
import { errorResponse, successResponse } from "../../helpers/serverResponse";
import appointmentmodel, { IAppointment } from "../../models/appointmentmodel";
import { Types, SortOrder } from "mongoose";
import slotbookingmodel, { ISlotBooking } from "../../models/slotbookingmodel";

const adminappointmentRouter = Router();

adminappointmentRouter.post("/getall", getallappointmentHandler);
adminappointmentRouter.delete("/delete", deleteappointmentHandler);
adminappointmentRouter.post("/create", admincreateappointmentHandler);

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
      .populate("patientid", "name email mobile")
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

async function admincreateappointmentHandler(req: Request, res: Response) {
  try {
    const {
      patientid,
      doctorid,
      date,
      slotid,
      starttime,
      endtime,
      slottype,
      price,
    }: Partial<IAppointment> & { slotid?: string; patientid: string } =
      req.body;

    if (!patientid || !doctorid || !date || !slotid || !starttime || !endtime) {
      return errorResponse(res, 400, "Some params are missing");
    }

    // Check if slot exists
    const slot: ISlotBooking | null = await slotbookingmodel.findOne({
      _id: slotid,
      doctorid,
      date,
    });

    if (!slot) {
      return errorResponse(res, 404, "Slot not found for doctor");
    }

    // Check if appointment already exists for this slot
    const alreadyBooked = await appointmentmodel.findOne({
      date: new Date(date),
      starttime: starttime.trim(),
      endtime: endtime.trim(),
      status: { $in: ["pending", "confirmed"] },
    });

    if (alreadyBooked) {
      return errorResponse(res, 400, "This slot is already booked");
    }

    // Create appointment with pending + unpaid
    const appointment = await appointmentmodel.create({
      patientid,
      doctorid,
      date,
      slotid,
      starttime: starttime.trim(),
      endtime: endtime.trim(),
      slottype: "offline",
      price: price || 700,
      status: "confirmed",
      paymentstatus: "paid",
      paymenttype: "cash",
    });

    // Fetch appointment with patient details
    const populatedAppointment = await appointmentmodel
      .findById(appointment._id)
      .populate("patientid", " name email mobile"); // adjust fields

    return successResponse(res, "Appointment created", populatedAppointment);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
