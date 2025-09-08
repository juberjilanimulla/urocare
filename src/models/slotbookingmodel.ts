import mongoose, { Schema, Document, model, Types } from "mongoose";

//  Define interface for SlotBooking
export interface ISlotBooking extends Document {

  doctorid: mongoose.Types.ObjectId;
  date: Date;
  starttime: string;
  endtime: string;
  slottype: "online" | "offline";
  createdAt?: Date;
  updatedAt?: Date;
}

//  Define schema
const slotbookingschema = new Schema<ISlotBooking>(
  {
    doctorid: {
      type: Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },
    date: { type: Date, required: true },
    starttime: { type: String, required: true },
    endtime: { type: String, required: true },
    slottype: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Utility function for IST offset
function currentLocalTimePlusOffset(): Date {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
}

// Pre-save hook
slotbookingschema.pre<ISlotBooking>("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

// Pre-update hook
slotbookingschema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

//  Create and export model
const slotbookingmodel = mongoose.model<ISlotBooking>(
  "slotbooking",
  slotbookingschema
);
export default slotbookingmodel;
