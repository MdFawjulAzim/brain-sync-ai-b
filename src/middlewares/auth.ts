import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authorization = req.headers.authorization;

      if (!authorization) {
        throw new Error("You are not authorized!");
      }

      let token = authorization;
      if (authorization.startsWith("Bearer ")) {
        token = authorization.split(" ")[1];
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      req.user = decoded;

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
