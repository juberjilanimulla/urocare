import { Router, Request, Response } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import slotbookingmodel, { ISlotBooking } from "../../models/slotbookingmodel";
import appointmentmodel, { IAppointment } from "../../models/appointmentmodel";

const userslotbookingRouter = Router();

userslotbookingRouter.get("/:doctorid", getuserslotbookingHandler);

export default userslotbookingRouter;

async function getuserslotbookingHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { doctorid } = req.params;
    const { date } = req.query as { date?: string };

    if (!doctorid || !date) {
      errorResponse(res, 400, "doctorid and date are required");
      return;
    }

    // Fetch slot availability (doctor added ranges like 10:00–18:00)
    const slots: ISlotBooking[] = await slotbookingmodel.find({
      doctorid,
      date: date,
    });

    if (!slots || slots.length === 0) {
      successResponse(res, "No slots found for this date", []);
      return;
    }

    // Fetch already booked appointments for the same doctor/date
    const bookedAppointments: IAppointment[] = await appointmentmodel.find({
      doctorid,
      date: date,
      status: { $in: ["pending", "confirmed"] }, // pending (in 7 min hold) or confirmed
    });

    const bookedTimes: string[] = bookedAppointments.map((a) => a.starttime);

    // Prepare response
    const slotResponse = slots.map((slot) => {
      return {
        _id: slot._id,
        doctorid: slot.doctorid,
        date: slot.date,
        starttime: slot.starttime,
        endtime: slot.endtime,
        slottype: slot.slottype,
        breaks: slot.breaks || [],
        slottimerange: slot.slottimerange,
        isBooked: bookedTimes.includes(slot.starttime), // add flag if booked
      };
    });

    successResponse(res, "Slots fetched successfully", slotResponse);
  } catch (error) {
    console.error("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
