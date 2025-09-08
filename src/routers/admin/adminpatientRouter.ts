import { Router, Request, Response } from "express";
import patientmodel, { IPatient } from "../../models/patientmodel";
import { successResponse, errorResponse } from "../../helpers/serverResponse";
import { SortOrder, Mongoose } from "mongoose";
import adminpatientimageRouter from "./adminuploadipatientmageRouter";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});
const adminpatientRouter = Router();

adminpatientRouter.post("/getall", getallpatientHandler);
adminpatientRouter.post("/create", createpatientHandler);
adminpatientRouter.put("/update/:id", updatepatientHandler);
adminpatientRouter.delete("/delete", deletepatientHandler);
adminpatientRouter.use("/upload", adminpatientimageRouter);
adminpatientRouter.delete("/singleimage", singleimagedeleteHandler);

export default adminpatientRouter;

async function getallpatientHandler(req: Request, res: Response) {
  try {
    const {
      pageno = 0,
      filterBy = {},
      sortby = {},
      search = "",
    }: {
      pageno?: number;
      filterBy?: Record<string, any>;
      sortby?: Record<string, "asc" | "desc">;
      search?: string;
    } = req.body;

    const limit = 10;
    const skip = pageno * limit;

    let query: any = { $and: [] };

    // Apply filters
    if (filterBy && Object.keys(filterBy).length > 0) {
      Object.keys(filterBy).forEach((key) => {
        if (filterBy[key] !== undefined) {
          query.$and.push({ [key]: filterBy[key] });
        }
      });
    }

    // Apply search
    if (search.trim()) {
      const searchRegex = new RegExp("\\b" + search.trim(), "i");
      const searchConditions = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { mobile: { $regex: searchRegex } },
      ];
      query.$and.push({ $or: searchConditions });
    }

    if (query.$and.length === 0) {
      query = {};
    }

    // Sorting logic
    const sortBy: Record<string, SortOrder> =
      Object.keys(sortby).length !== 0
        ? Object.keys(sortby).reduce<Record<string, SortOrder>>((acc, key) => {
            acc[key] = sortby[key] === "asc" ? 1 : -1;
            return acc;
          }, {})
        : { createdAt: -1 };

    const patient: IPatient[] = await patientmodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await patientmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "Success", { patient, totalPages });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createpatientHandler(req: Request, res: Response) {
  try {
    const {
      name,
      sex,
      age,
      mobile,
      email,
      area,
      referraldoctor,
      referrallab,
      height,
      materialstatus,
      occupation,
      pincode,
      weight,
      image,
      bloodgroup,
      dateofbirth,
      address,
    } = req.body;

    if (!name || !mobile) {
      return errorResponse(res, 400, "Name and Mobile are required");
    }

    const formattedReferralDoctor = referraldoctor
      ? {
          name: referraldoctor.name || "",
          mobile: referraldoctor.mobile || "",
          area: referraldoctor.area || "",
        }
      : undefined;

    const newPatient = await patientmodel.create({
      name,
      sex,
      age,
      mobile,
      email,
      area,
      referraldoctor: formattedReferralDoctor,
      referrallab,
      height,
      materialstatus,
      occupation,
      pincode,
      weight,
      image,
      bloodgroup,
      dateofbirth,
      address,
    });

    const patient = await newPatient.save();
    return successResponse(res, "Patient created successfully", patient);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updatepatientHandler(req: Request, res: Response) {
  try {
    const { id } = req.params; // patient id from URL params

    if (!id) {
      return errorResponse(res, 400, "Patient ID is required");
    }

    // prepare update object (only update fields sent in body)
    const {
      name,
      sex,
      age,
      mobile,
      email,
      area,
      referraldoctor,
      referrallab,
      height,
      materialstatus,
      occupation,
      pincode,
      weight,
      image,
      bloodgroup,
      dateofbirth,
      address,
    } = req.body;

    const formattedReferralDoctor = referraldoctor
      ? {
          name: referraldoctor.name || "",
          mobile: referraldoctor.mobile || "",
          area: referraldoctor.area || "",
        }
      : undefined;

    const updateData: any = {
      ...(name && { name }),
      ...(sex && { sex }),
      ...(age && { age }),
      ...(mobile && { mobile }),
      ...(email && { email }),
      ...(area && { area }),
      ...(referraldoctor && { referraldoctor: formattedReferralDoctor }),
      ...(referrallab && { referrallab }),
      ...(height && { height }),
      ...(materialstatus && { materialstatus }),
      ...(occupation && { occupation }),
      ...(pincode && { pincode }),
      ...(weight && { weight }),
      ...(image && { image }),
      ...(bloodgroup && { bloodgroup }),
      ...(dateofbirth && { dateofbirth }),
      ...(address && { address }),
    };

    const updatedPatient = await patientmodel.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // return updated doc
    );

    if (!updatedPatient) {
      return errorResponse(res, 404, "Patient not found");
    }

    return successResponse(res, "Patient updated successfully", updatedPatient);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletepatientHandler(req: Request, res: Response) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "patient ID (_id) is required");
    }

    // Find property before deletion (to access images)
    const patient = await patientmodel.findById(_id);
    if (!patient) {
      return errorResponse(res, 404, "patient not found");
    }

    // Delete all images from S3
    const s3Key = patient.image?.split(".amazonaws.com/")[1];

    if (s3Key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
        })
      );
    }

    // Delete patient from DB
    await patientmodel.findByIdAndDelete(_id);

    return successResponse(res, "patient and associated images deleted");
  } catch (error) {
    console.log("error", error);
  }
}

async function singleimagedeleteHandler(req: Request, res: Response) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "patient ID (_id) is required");
    }

    const patient = await patientmodel.findById(_id);
    if (!patient) {
      return errorResponse(res, 404, "patient not found");
    }

    const imageUrl = patient.image;
    const s3Key = imageUrl?.split(".amazonaws.com/")[1];

    if (s3Key) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
      });
      await s3.send(deleteCommand);
    }

    patient.image = ""; // Clear image reference from DB
    await patient.save();

    return successResponse(res, "patient image deleted successfully", patient);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
