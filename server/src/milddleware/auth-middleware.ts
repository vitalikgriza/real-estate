import {Response, Request, NextFunction}  from "express";
import jwt, {JwtPayload} from "jsonwebtoken";

interface DecodedToken extends JwtPayload {
  sub: string;
  "custom:role"?: string;
}

const jwtVerificationKey = process.env.JWT_SECRET || process.env.JWT_PUBLIC_KEY;

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

export const authMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({message: "Unauthorized"});
    }

    if (!jwtVerificationKey) {
      return res.status(500).json({message: "Authentication is not configured"});
    }

    try {
      const decoded = jwt.verify(token, jwtVerificationKey) as DecodedToken;
      const userRole = decoded["custom:role"] || "";

      if (!decoded.sub) {
        return res.status(401).json({message: "Invalid token"});
      }

      req.user = {
        id: decoded.sub,
        role: userRole,
      }

      const hasAccess = allowedRoles.includes(userRole.toLowerCase());

      if (!hasAccess) {
        return res.status(403).json({message: "Access denied"});
      }
    } catch (e) {
      return res.status(401).json({message: "Invalid token"});
    }

    next();
  };
};
