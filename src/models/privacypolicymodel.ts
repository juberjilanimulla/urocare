import { Schema, model, Document } from "mongoose";

export interface IPrivacyPolicyItem {
  title?: string;
  value?: string;
}

export interface IPrivacyPolicySection {
  section: string;
  items: IPrivacyPolicyItem[];
}

export interface IPrivacyPolicy extends Document {
  privacypolicy: IPrivacyPolicySection[];
  createdAt?: Date;
  updatedAt?: Date;
}

const privacypolicySchema = new Schema<IPrivacyPolicy>(
  {
    privacypolicy: [
      {
        section: {
          type: String,
          required: true,
        },
        items: [
          {
            title: { type: String },
            value: { type: String },
          },
        ],
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset(): Date {
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
