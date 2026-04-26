import {Response, Request, NextFunction}  from "express";
import jwt, {JwtPayload} from "jsonwebtoken";

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

const getJwtSecret = (): string | null => {
  const jwtSecret = process.env.JWT_SECRET;

  if (jwtSecret) {
    return jwtSecret;
  }

  const cognitoClientSecret = process.env.COGNITO_CLIENT_SECRET;

  if (cognitoClientSecret) {
    return cognitoClientSecret;
  }

  return null;
};

export const authMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({message: "Unauthorized"});
    }

    const jwtSecret = getJwtSecret();

    if (!jwtSecret) {
      return res.status(500).json({message: "Authentication is not configured"});
    }

    try {
      const decoded = jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
      }) as DecodedToken;
      const userRole = decoded["custom:role"] || "";

      req.user = {
        id: decoded.sub,
        role: userRole,
      };

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
