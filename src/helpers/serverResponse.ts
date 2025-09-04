import { Response } from "express";

interface ApiResponse<T = any> {
  status: number;
  error: boolean;
  message: string;
  data: T | null;
}

export function successResponse<T>(
  res: Response,
  message: String,
  data: T | null = null
): Response<ApiResponse<T>> {
  return res.status(200).json({
    status: 200,
    error: false,
    message,
    data,
  });
}

export function errorResponse<T>(
  res: Response,
  statusCode: number,
  message: string
): Response<ApiResponse<null>> {
  return res.status(statusCode).json({
    status: statusCode,
    error: true,
    message,
    data: null,
  });
}
