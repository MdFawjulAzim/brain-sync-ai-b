import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

interface ErrorSource {
  path: string;
  message: string;
}

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = err.message || "Something went wrong!";
  let errorSources: ErrorSource[] = [
    {
      path: "",
      message: "Something went wrong",
    },
  ];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    const errors: Record<string, string> = {};
    err.issues.forEach((issue) => {
      const path =
        issue.path.length > 0
          ? String(issue.path[issue.path.length - 1])
          : "root";
      errors[path] = issue.message;
    });
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  } else if (err.code === "P2002") {
    statusCode = 409;
    message = "Duplicate Entry";
    const errors: Record<string, string> = {};
    const target = err.meta?.target;
    if (target) {
      errors[target] = `This ${target} already exists`;
    } else {
      errors["unknown"] = "Duplicate entry detected";
    }
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
  });
};

export default globalErrorHandler;
