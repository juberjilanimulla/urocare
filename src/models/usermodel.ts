import { Schema, model, Document } from "mongoose";

// 1. Create an interface describing the User document
export interface IUser extends Document {
  firstname: string;
  lastname: string;
  mobile: string;
  email: string;
  role: string;
  password: string;
  tokenotp: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Define the schema
const userschema = new Schema<IUser>(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      default: "user",
    },
    password: { type: String, required: true },
    tokenotp: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

// 3. Custom function for offset time
function currentLocalTimePlusOffset(): Date {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000; // IST offset
  return new Date(now.getTime() + offset);
}

// 4. Pre-save hook
userschema.pre<IUser>("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

// 5. Pre-update hook
userschema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

// 6. Create the model
const usermodel = model<IUser>("user", userschema);
export default usermodel;
