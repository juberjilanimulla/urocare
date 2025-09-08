import { Router, Request, Response } from "express";
import multer from "multer";
import fs, { createReadStream } from "fs";
import path from "path";
// import { fileURLToPath } from "url";
import { dirname } from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  successResponse,
  errorResponse,
} from "../../helpers/serverResponse.js";
import patientmodel from "../../models/patientmodel.js";

// AWS S3 v3 Setup
const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

// Multer Setup (store temporarily in /temp before sending to S3)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../temp");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(ext);
    if (isImage) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
}).single("patientimage"); // Accept only one image

const adminpatientimageRouter = Router();

// 📌 Upload Patient Image and Save to S3
adminpatientimageRouter.post("/:id", (req: Request, res: Response) => {
  upload(req, res, async (err) => {
    if (err) return errorResponse(res, 400, err.message || "Upload error");
    if (!req.file) return errorResponse(res, 400, "No file uploaded");

    try {
      const patient = await patientmodel.findById(req.params.id);
      if (!patient) {
        fs.unlinkSync(req.file.path);
        return errorResponse(res, 404, "Patient not found");
      }

      const fileStream = createReadStream(req.file.path);
      const fileName = `${req.params.id}-${Date.now()}${path.extname(
        req.file.originalname
      )}`;
      const s3Key = `patientimages/${fileName}`;

      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: fileStream,
        ContentType: req.file.mimetype,
      });

      await s3.send(uploadCommand);

      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
      patient.image = imageUrl;

      await patient.save();
      fs.unlinkSync(req.file.path); // Delete temp file

      return successResponse(
        res,
        "Patient image uploaded successfully",
        patient
      );
    } catch (error: any) {
      console.error("Upload failed:", error);
      if (fs.existsSync(req.file?.path)) fs.unlinkSync(req.file.path);
      return errorResponse(res, 500, "Image upload failed");
    }
  });
});

export default adminpatientimageRouter;
