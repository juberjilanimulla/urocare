import { Request, Response, NextFunction } from "express";
import { errorResponse } from "./serverResponse";
import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import crypto from "crypto";
import usermodel from "../models/usermodel";

const secretKey: string =
  process.env.JWT_SECRET || crypto.randomBytes(48).toString("hex");

//jwt token generation
export function generateAccessToken(id: string, email: string, role: string) {
  const sessionid = createSession(id);

  const encodedPayload = { id, email, role };
  const publicPayload = { id, email, role, sessionid };

  const encoded_token = jwt.sign(encodedPayload, secretKey, {
    expiresIn: "1m",
  });
  const public_token = jwt.sign(publicPayload, secretKey, { expiresIn: "1m" });

  return { encoded_token, public_token };
}

export function validateToken(token: string): string | JwtPayload {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    throw error;
  }
}

//middleware
export function isAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isAdmin = res.locals.role;
  if (!isAdmin || isAdmin !== "admin") {
    errorResponse(res, 403, "User not authorized");
    return;
  }
  next();
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader =
    (req.headers.authorization as string) || (req.query.token as string);

  if (!authHeader) {
    errorResponse(res, 401, "Token not found");
    return;
  }

  const encoded_token = authHeader.split(" ")[1];

  if (!encoded_token) {
    res.status(401).json("Unauthorized user");
    return;
  }

  try {
    const decoded = jwt.verify(encoded_token, secretKey) as JwtPayload;

    if (!decoded.role || !decoded.email) {
      res.status(401).json("Unauthorized user");
      return;
    }

    res.locals.id = decoded.id;
    res.locals.role = decoded.role;
    res.locals.email = decoded.email;

    next();
  } catch (error: any) {
    console.log(error.message);
    errorResponse(res, 401, "User not authorized");
  }
}

//password helpers
export function bcryptPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(
  password: string,
  hashedPassword: string
): Boolean {
  return bcrypt.compareSync(password, hashedPassword);
}

//sessions
const sessions = new Map<string, string>();

export function createSession(id: string): string {
  const sessionId = uuidv4();
  sessions.set(id, sessionId);
  return sessionId;
}

export function getSessionData(id: string): string | null {
  return sessions.get(id) || null;
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}
// ----------------------
// CREATE DEFAULT ADMIN
// ----------------------
export async function Admin(): Promise<void> {
  const adminStr = process.env.ADMIN;
  if (!adminStr) return;

  const admins = adminStr.split(",");

  for (const email of admins) {
    const exist = await usermodel.findOne({ email });
    if (!exist) {
      await usermodel.create({
        firstname: "admin",
        lastname: "admin",
        email,
        role: "admin",
        mobile: 9966470788,
        password: bcryptPassword("Urocare0832#*"),
      });
    }
  }
}

export function toIST(date: Date): string {
  // Convert UTC date to IST and return ISO-like string
  const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 in ms
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().replace("Z", "+05:30");
}
