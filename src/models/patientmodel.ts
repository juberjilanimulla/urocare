import mongoose, { model, Schema } from "mongoose";

const patientSchema = new Schema(
  {
    name: { type: String },
    sex: String,
    age: String,
    mobile: String,
    email: String,
    area: String,
    referrallab: String,
    admissiontype: String,
    visittype: String,
    height: String,
    materialstatus: String,
    occupation: String,
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    weight: String,
    image: String,
    bloodgroup: String,
    familyhead: String,
    dateofbirth: Date,
    
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
}

patientSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

patientSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ upadtedAt: currentTime });
  next();
});

const patientmodel = model("patient", patientSchema);
export default patientmodel;
