import { Response, Request, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface DecodedToken extends JwtPayload {
  sub: string;
  "custom:role"?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
      }
    }
  }
}

const getJwtVerificationKey = (): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwtSecret;
};

export const authMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(token, getJwtVerificationKey()) as DecodedToken;
      const userRole = decoded["custom:role"]?.toLowerCase() || "";

      req.user = {
        id: decoded.sub,
        role: userRole,
      };

      const hasAccess = allowedRoles.includes(userRole);

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    next();
  };
};
