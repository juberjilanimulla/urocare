import mongoose, { Schema, Document, model, Types } from "mongoose";

//  Define interface for SlotBooking
interface Break {
  breakstart: string;
  breakend: string;
}
export interface ISlotBooking extends Document {
  doctorid: mongoose.Types.ObjectId;
  date: string;
  starttime: string;
  endtime: string;
  startDateTime: Date; // combined date+time
  endDateTime: Date;
  slottype: "online" | "offline";
  slottimerange: string;
  createdAt?: Date;
  updatedAt?: Date;
  breaks?: Break[];
}

//  Define schema
const slotbookingschema = new Schema<ISlotBooking>(
  {
    doctorid: {
      type: Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },
    date: { type: String, required: true },
    starttime: { type: String, required: true },
    endtime: { type: String, required: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    slottype: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    slottimerange: { type: String },
    breaks: [
      {
        breakstart: { type: String },
        breakend: { type: String },
      },
    ],
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
