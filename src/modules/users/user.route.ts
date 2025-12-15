import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

router.post(
  "/register",
  validateRequest(UserValidation.registerUserZodSchema),
  UserControllers.registerUser
);

router.post(
  "/login",
  validateRequest(UserValidation.loginUserZodSchema),
  UserControllers.loginUser
);

export const UserRoutes = router;
