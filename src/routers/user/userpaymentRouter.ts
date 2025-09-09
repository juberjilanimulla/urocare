import { Router, Request, Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import appointmentmodel, { IAppointment } from "../../models/appointmentmodel";
import paymentmodel, { IPayment } from "../../models/paymentmodel";

const userpaymentRouter = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

userpaymentRouter.post("/order", createorderHandler);
userpaymentRouter.post("/verify", verifypaymentHandler);

export default userpaymentRouter;

interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  method?: string;
}

async function createorderHandler(req: Request, res: Response) {
  try {
    const { appointmentid, amount, method } = req.body as {
      appointmentid?: string;
      amount?: number;
      method?: string;
    };

    if (!appointmentid || !amount || method) {
      return errorResponse(res, 400, "appointmentid and amount are required");
    }

    const appointment: IAppointment | null = await appointmentmodel.findById(
      appointmentid
    );

    if (!appointment) {
      return errorResponse(res, 404, "appointment not found");
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${appointmentid}`,
    };

    const order = await razorpay.orders.create(options);

    // Save payment record
    const payment: IPayment = await paymentmodel.create({
      appointmentid: appointmentid,
      doctorid: appointment.doctorid,
      amount,
      orderid: order.id,
      paymentstatus: "created",
      method,
    });

    successResponse(res, "Order created", {
      orderId: order.id,
      amount: order.amount,
      paymentid: payment._id,
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, "Internal server error");
  }
}

async function verifypaymentHandler(req: Request, res: Response) {
  try {
    const { appointmentid, orderid, paymentid, signature } = req.body as {
      appointmentid?: string;
      orderid?: string;
      paymentid?: string;
      signature?: string;
    };

    if (!appointmentid || !orderid || !paymentid || !signature) {
      return errorResponse(res, 400, "Missing payment verification params");
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(orderid + "|" + paymentid)
      .digest("hex");

    if (generatedSignature !== signature) {
      return errorResponse(res, 400, "Invalid payment signature");
    }
    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID as string,
      key_secret: process.env.RAZORPAY_KEY_SECRET as string,
    });

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpayInstance.payments.fetch(paymentid);
    const actualMethod: string = paymentDetails.method;
    // Update appointment
    await appointmentmodel.findByIdAndUpdate(appointmentid, {
      status: "confirmed",
      paymentstatus: "paid",
      paymenttype: actualMethod,
    });

    // Update payment
    const payment = await paymentmodel.findOneAndUpdate(
      { orderid },
      {
        paymentid,
        signature,
        method: actualMethod,
        paymentstatus: "paid",
        paidAt: new Date(),
      },
      { new: true }
    );

    successResponse(res, "Payment verified successfully", payment);
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, "Internal server error");
  }
}
