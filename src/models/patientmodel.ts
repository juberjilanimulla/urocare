import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReferralDoctor {
  name?: string;
  mobile?: string;
  area?: string;
}
// ---------------- Interface ---------------- //
export interface IPatient extends Document {
  name?: string;
  sex?: string;
  age?: string;
  mobile?: string;
  email?: string;
  area?: string;
  referraldoctor?: IReferralDoctor;
  referrallab?: string;
  height?: string;
  materialstatus?: string; // maybe you meant maritalstatus?
  occupation?: string;
  pincode?: string;
  weight?: string;
  image?: string;
  bloodgroup?: string;
  dateofbirth?: Date;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ---------------- Schema ---------------- //
const patientSchema = new Schema<IPatient>(
  {
    name: { type: String },
    sex: { type: String },
    age: { type: String },
    mobile: { type: String },
    email: { type: String },
    area: { type: String },
    referraldoctor: {
      name: { type: String },
      mobile: { type: String },
      area: { type: String },
    },
    referrallab: { type: String },
    height: { type: String },
    materialstatus: { type: String }, // typo kept as-is
    occupation: { type: String },
    pincode: { type: String },
    weight: { type: String },
    image: { type: String },
    bloodgroup: { type: String },
    dateofbirth: { type: Date },
    address: { type: String },
  },
  { timestamps: true, versionKey: false }
);

// ---------------- Time Offset Helpers ---------------- //
function currentLocalTimePlusOffset(): Date {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000; // +5:30 IST
  return new Date(now.getTime() + offset);
}

// ---------------- Hooks ---------------- //
patientSchema.pre<IPatient>("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

patientSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const patientmodel: Model<IPatient> = mongoose.model<IPatient>(
  "patient",
  patientSchema
);
export default patientmodel;
