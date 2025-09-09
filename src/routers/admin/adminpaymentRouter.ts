import { Router, Request, Response } from "express";
import { SortOrder } from "mongoose";
import paymentmodel from "../../models/paymentmodel";
import { successResponse, errorResponse } from "../../helpers/serverResponse";
import appointmentmodel from "../../models/appointmentmodel";

const adminpaymentRouter = Router();

adminpaymentRouter.post("/getall", getallpaymentHandler);
adminpaymentRouter.delete("/delete", deletepaymentHandler);
adminpaymentRouter.post("/create", admincreatepaymentHandler);

export default adminpaymentRouter;

// ---------------- Handlers ---------------- //

async function getallpaymentHandler(
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

    let query: Record<string, any> = { $and: [] };

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
      const searchRegex = new RegExp(search.trim(), "i");
      query.$and.push({ orderId: { $regex: searchRegex } });
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

    // Fetch with populate
    const payments = await paymentmodel
      .find(query)
      .populate(
        "appointmentid",
        "patientname patientemail patientmobile date starttime endtime status"
      )
      .populate("doctorid", "name specialization")
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await paymentmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "Payments fetched successfully", {
      payments,
      totalCount,
      totalPages,
    });
  } catch (error) {
    console.error("getallpaymentHandler error:", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletepaymentHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { paymentid }: { paymentid?: string } = req.body;

    if (!paymentid) {
      errorResponse(res, 400, "some params are missing");
      return;
    }

    const payment = await paymentmodel.findByIdAndDelete({ _id: paymentid });

    if (!payment) {
      errorResponse(res, 404, "payment id not found");
      return;
    }

    successResponse(res, "successfully deleted");
  } catch (error) {
    console.error("deletepaymentHandler error:", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function admincreatepaymentHandler(req: Request, res: Response) {
  try {
    const {
      appointmentid,
      amount,
      method, // "cash" | "upi" | "card"
      message,
    }: {
      appointmentid?: string;
      amount?: number;
      method?: string;
      message?: string;
    } = req.body;

    if (!appointmentid || !amount || !method) {
      return errorResponse(
        res,
        400,
        "appointmentid, amount and method are required"
      );
    }

    const appointment = await appointmentmodel.findById(appointmentid);
    if (!appointment) {
      return errorResponse(res, 404, "Appointment not found");
    }

    // Create offline payment entry
    const payment = await paymentmodel.create({
      appointmentid,
      doctorid: appointment.doctorid,
      userid: appointment.patientid,
      amount,
      paymentstatus: "paid",
      paymentmode: method, // cash/upi/card
      message: message || "Offline payment at reception",
      paidAt: new Date(),
    });

    // Update appointment status
    appointment.paymentstatus = "paid";
    appointment.status = "confirmed";
    await appointment.save();

    return successResponse(
      res,
      "Offline payment recorded successfully",
      payment
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
