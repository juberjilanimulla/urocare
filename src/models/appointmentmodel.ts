import mongoose, { Schema, Document, model } from "mongoose";

// 1Define the TypeScript interface for appointment
export interface IAppointment extends Document {
  patientname?: string;
  patientmobile?: string;
  patientemail?: string;
  doctorid: mongoose.Types.ObjectId;
  specialization?: string;
  date?: Date;
  starttime: string;
  endtime: string;
  slottype: "online" | "offline";
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "unpaid" | "paid";
  price: { type: number; default: 700 };
  createdAt?: Date;
  updatedAt?: Date;
}

// Define Schema
const appointmentschema = new Schema<IAppointment>(
  {
    patientname: { type: String },
    patientmobile: { type: String },
    patientemail: { type: String },
    doctorid: { type: Schema.Types.ObjectId, ref: "doctor", required: true },
    specialization: { type: String },
    date: { type: Date },
    starttime: { type: String, required: true },
    endtime: { type: String, required: true },
    slottype: { type: String, enum: ["online", "offline"], required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    price: { type: Number, default: 700 },
  },
  { timestamps: true, versionKey: false }
);

// Utility function for local time offset
function currentLocalTimePlusOffset(): Date {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000; // 5.5 hours in ms
  return new Date(now.getTime() + offset);
}

//  Middleware hooks
appointmentschema.pre<IAppointment>("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

appointmentschema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

// Create Model
const appointmentmodel = model<IAppointment>("appointment", appointmentschema);
export default appointmentmodel;
