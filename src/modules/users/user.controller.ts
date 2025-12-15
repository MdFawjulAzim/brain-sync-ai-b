import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../config/db";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = req.body;

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const result = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = result;

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      data: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new Error("Invalid password");
    }

    const jwtPayload = {
      id: user.id,
      email: user.email,
    };

    const accessToken = jwt.sign(jwtPayload, env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully!",
      data: {
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const UserControllers = {
  registerUser,
  loginUser,
};
