import { Request, Response } from "express";

export const ensureAuthenticatedUserMatchesParam = (
  req: Request,
  res: Response,
  cognitoId: string,
): boolean => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }

  if (req.user.id !== cognitoId) {
    res.status(403).json({ message: "Access denied" });
    return false;
  }

  return true;
};
