import {Response, Request, NextFunction} from "express";
import jwt, {Algorithm, JwtPayload} from "jsonwebtoken";

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

const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwtSecret;
};

const JWT_VERIFY_OPTIONS: { algorithms: Algorithm[] } = {
  algorithms: ["HS256"],
};

export const authMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({message: "Unauthorized"});
    }

    try {
      const decoded = jwt.verify(token, getJwtSecret(), JWT_VERIFY_OPTIONS) as DecodedToken;
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
    } catch (error) {
      if (error instanceof Error && error.message === "JWT_SECRET is not configured") {
        return res.status(500).json({message: "Authentication configuration error"});
      }

      return res.status(401).json({message: "Invalid token"});
    }

    next();
  };
};
