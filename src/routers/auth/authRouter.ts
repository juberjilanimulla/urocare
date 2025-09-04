import { Router, Request, Response } from "express";
import {
  errorResponse,
  successResponse,
} from "../../helpers/serverResponse.js";
import {
  comparePassword,
  generateAccessToken,
} from "../../helpers/helperFunction.js";
import usermodel, { IUser } from "../../models/usermodel.js";

const authRouter = Router();

authRouter.post("/signin", signinHandler);

export default authRouter;

// 👇 Signin Handler with TypeScript types
async function signinHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      errorResponse(res, 400, "some params are missing");
      return;
    }
    const user: IUser | null = await usermodel.findOne({ email });

    if (!user) {
      errorResponse(res, 404, "email not found");
      return;
    }

    const isPasswordValid: Boolean = comparePassword(password, user.password);

    if (!isPasswordValid) {
      errorResponse(res, 401, "invalid password");
      return;
    }

    const userId: string = user._id.toString();

    const {
      encoded_token,
      public_token,
    }: { encoded_token: string; public_token: string } = generateAccessToken(
      userId,
      user.email,
      user.role
    );

    successResponse(res, "SignIn successfully", {
      encoded_token,
      public_token,
    });
  } catch (error) {
    console.error("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
