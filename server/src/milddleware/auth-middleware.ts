import {Response, Request, NextFunction} from "express";
import jwt, {JwtPayload} from "jsonwebtoken";

interface DecodedToken extends JwtPayload {
  sub: string;
  token_use?: string;
  "custom:role"?: string;
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
      };
    }
  }
}

export const authMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({message: "Unauthorized"});
    }

    try {
      const decoded = jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
      }) as DecodedToken;
      const userRole = decoded["custom:role"] || "";

      if (!decoded.sub) {
        return res.status(401).json({message: "Invalid token"});
      }

      req.user = {
        id: decoded.sub,
        role: userRole,
      };

      const hasAccess = allowedRoles.includes(userRole.toLowerCase());

      if (!hasAccess) {
        return res.status(403).json({message: "Access denied"});
      }
    } catch {
      return res.status(401).json({message: "Invalid token"});
    }

    next();
  };
};
