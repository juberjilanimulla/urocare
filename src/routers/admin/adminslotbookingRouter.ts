import { Router, Request, Response } from "express";
import { SortOrder } from "mongoose";
import slotbookingmodel from "../../models/slotbookingmodel";
import appointmentmodel from "../../models/appointmentmodel";
import { successResponse, errorResponse } from "../../helpers/serverResponse";

const adminslotbookingRouter = Router();

adminslotbookingRouter.post("/", getslotbookingHandler);
adminslotbookingRouter.post("/create", createslotbookingHandler);
adminslotbookingRouter.put("/update", updateslotbookingHandler);
adminslotbookingRouter.delete("/delete", deleteslotbookingHandler);

export default adminslotbookingRouter;

// ---------------- Handlers ---------------- //

async function getslotbookingHandler(
  req: Request,
  res: Response
): Promise<void> {
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

    let query: Record<string, any> = {};

    // Apply search
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { starttime: searchRegex },
        { endtime: searchRegex },
        { slottype: searchRegex },
      ];
    }

    // Apply filters
    if (filterBy && Object.keys(filterBy).length > 0) {
      query = {
        ...query,
        ...filterBy,
      };
    }

    // Sorting logic
    const sortBy: Record<string, SortOrder> =
      Object.keys(sortby).length !== 0
        ? Object.keys(sortby).reduce<Record<string, SortOrder>>((acc, key) => {
            acc[key] = sortby[key] === "asc" ? 1 : -1;
            return acc;
          }, {})
        : { createdAt: -1 };

    // Fetch paginated slotbooking
    const slotbooking = await slotbookingmodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await slotbookingmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "successfully", {
      slotbooking,
      totalPages,
    });
  } catch (error) {
    console.error("getslotbookingHandler error:", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createslotbookingHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { doctorid, date, starttime, endtime, slottype } = req.body;

    if (!doctorid || !date || !starttime || !endtime || !slottype) {
      errorResponse(res, 400, "some params are missing");
      return;
    }

    const existingSlot = await slotbookingmodel.findOne({
      doctorid,
      date,
      starttime,
      endtime,
    });

    if (existingSlot) {
      errorResponse(res, 400, "This slot already exists for the doctor");
      return;
    }

    const params = { doctorid, date, starttime, endtime, slottype };
    const slotbooking = await slotbookingmodel.create(params);

    successResponse(res, "success", slotbooking);
  } catch (error) {
    console.error("createslotbookingHandler error:", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updateslotbookingHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { _id, ...updatedData } = req.body;

    if (!_id) {
      errorResponse(res, 400, "slot booking ID (_id) is required");
      return;
    }

    const existingslotbooking = await slotbookingmodel.findById(_id);
    if (!existingslotbooking) {
      errorResponse(res, 404, "slotbooking does not exist");
      return;
    }

    const { doctorid, date, starttime, endtime, slottype } = updatedData;

    if (!doctorid || !date || !starttime || !endtime || !slottype) {
      errorResponse(res, 400, "Some params are missing");
      return;
    }

    // Check if another slot exists with same doctor/date/time
    const duplicateSlot = await slotbookingmodel.findOne({
      doctorid,
      date,
      starttime,
      endtime,
      _id: { $ne: _id }, // exclude current slot
    });

    if (duplicateSlot) {
      errorResponse(res, 400, "This slot is already booked for the doctor");
      return;
    }

    // Update slot booking
    const options = { new: true };
    const slotbooking = await slotbookingmodel.findByIdAndUpdate(
      _id,
      updatedData,
      options
    );

    await appointmentmodel.updateMany(
      { doctorid, date, slotid: _id },
      { status: "cancelled" }
    );

    successResponse(res, "Successfully updated", slotbooking);
  } catch (error) {
    console.error("updateslotbookingHandler error:", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deleteslotbookingHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { _id }: { _id?: string } = req.body;

    if (!_id) {
      errorResponse(res, 400, "slot booking ID (_id) is required");
      return;
    }

    const slot = await slotbookingmodel.findById(_id);
    if (!slot) {
      errorResponse(res, 404, "Slot not found in database");
      return;
    }

    await appointmentmodel.updateMany(
      { doctorid: slot.doctorid, date: slot.date, slotid: _id },
      { status: "cancelled" }
    );

    await slotbookingmodel.findByIdAndDelete(_id);

    successResponse(res, "Slot deleted and related appointments cancelled");
  } catch (error) {
    console.error("deleteslotbookingHandler error:", error);
    errorResponse(res, 500, "internal server error");
  }
}
