import { Router, Request, Response } from "express";
import patientmodel, { IPatient } from "../../models/patientmodel";
import { successResponse, errorResponse } from "../../helpers/serverResponse";

const adminpatientRouter = Router();

adminpatientRouter.post("/create", createpatientHandler);

export default adminpatientRouter;

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
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletepatientHandler(req: Request, res: Response){
    try {
        
    } catch (error) {
        console.log("error",error)
    }
}