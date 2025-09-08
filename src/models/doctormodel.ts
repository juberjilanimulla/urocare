import { Schema, model, Document } from "mongoose";

// ---------------- Interface ---------------- //
export interface IDoctor extends Document {
  _id: string;
  name: string;
  mobile: string;
  email: string;
  address?: string;
  specialization: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------- Schema ---------------- //
const doctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String },
    specialization: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

// ---------------- Helper ---------------- //
function currentLocalTimePlusOffset(): Date {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000; // +5:30 offset
  return new Date(now.getTime() + offset);
}

// ---------------- Hooks ---------------- //
doctorSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

doctorSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

// ---------------- Model ---------------- //
const doctormodel = model<IDoctor>("doctor", doctorSchema);
export default doctormodel;
