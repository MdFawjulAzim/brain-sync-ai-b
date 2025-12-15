import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import router from "./routes";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app: Application = express();

// Middlewares
app.use(express.json()); // Only JSON parser is needed
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Health Check
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "BrainSync AI Server is Running!",
    status: "success",
  });
});

// Routes
app.use("/api/v1", router);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
