import { Document, Schema, model, Types } from "mongoose";

export interface IPrivacyPolicyItem {
  _id: Types.ObjectId; // <-- Add this
  title: string;
  value: string;
}

export interface IPrivacyPolicySection {
  _id: Types.ObjectId; // <-- Add this
  section: string;
  items: IPrivacyPolicyItem[];
}

export interface IPrivacyPolicy extends Document {
  privacypolicy: IPrivacyPolicySection[];
  createdAt?: Date;
  updatedAt?: Date;
}

const privacyPolicyItemSchema = new Schema<IPrivacyPolicyItem>({
  title: { type: String },
  value: { type: String },
});

const privacyPolicySectionSchema = new Schema<IPrivacyPolicySection>({
  section: { type: String, required: true },
  items: [privacyPolicyItemSchema],
});

const privacypolicySchema = new Schema<IPrivacyPolicy>(
  {
    privacypolicy: [privacyPolicySectionSchema],
  },
  { timestamps: true, versionKey: false }
);

// Time adjustment hooks
function currentLocalTimePlusOffset() {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
}

privacypolicySchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

privacypolicySchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const privacypolicymodel = model<IPrivacyPolicy>(
  "privacypolicy",
  privacypolicySchema
);

export default privacypolicymodel;
