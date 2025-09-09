import mongoose, { Schema, Document, model, Types } from "mongoose";

//  Define the TypeScript interface for Payment
export interface IPayment extends Document {
  appointmentid: mongoose.Types.ObjectId;
  doctorid: mongoose.Types.ObjectId;
  patientid: mongoose.Types.ObjectId;
  amount?: number;
  paymentstatus: "created" | "pending" | "paid" | "failed" | "refunded";
  orderid?: string;
  paymentid?: string;
  razorpay_payment_id: string;
  signature?: string;
  method?: string; // card, UPI, netbanking, wallet, etc.
  errormessage?: string;
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define Schema
const paymentschema = new Schema<IPayment>(
  {
    appointmentid: {
      type: Schema.Types.ObjectId,
      ref: "appointment",
      required: true,
    },
    patientid: { type: Schema.Types.ObjectId, ref: "patient" },
    doctorid: { type: Schema.Types.ObjectId, ref: "doctor", required: true },
    amount: { type: Number },
    paymentstatus: {
      type: String,
      enum: ["created", "pending", "paid", "failed", "refunded"],
      default: "created",
    },
    orderid: { type: String },
    paymentid: { type: String },
    razorpay_payment_id: { type: String },
    signature: { type: String },
    method: { type: String },
    errormessage: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

//  Utility function for IST offset
function currentLocalTimePlusOffset(): Date {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000; // 5.5 hours in ms
  return new Date(now.getTime() + offset);
}

//  Middleware hooks
paymentschema.pre<IPayment>("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

paymentschema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

// Create Model
const paymentmodel = model<IPayment>("payment", paymentschema);
export default paymentmodel;
