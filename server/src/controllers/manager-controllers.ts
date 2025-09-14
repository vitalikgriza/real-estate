import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ManagerRequestParams {
  cognitoId: string;
}

export const getManager = async (req: Request<ManagerRequestParams>, res: Response): Promise<void> => {
    const { cognitoId } = req.params;

    try {
      const manager = await prisma.manager.findUnique({
        where: { cognitoId },
      });

      if (manager) {
        res.status(200).json(manager);
      } else {
        res.status(404).json({ message: 'No manager found' });
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Error retrieving manager ' + error.message });
    }
  }

  export const createManager = async (req: Request<ManagerRequestParams>, res: Response): Promise<void> => {
    const { cognitoId, name, email, phoneNumber } = req.body;

    try {
      const manager = await prisma.manager.create({
        data: { cognitoId, name, email, phoneNumber },
      });

      res.status(201).send(manager);
    } catch (error: any) {
      res.status(500).json({ message: 'Error creating manager ' + error.message });
    }
  }

export const updateManager = async (req: Request<ManagerRequestParams>, res: Response): Promise<void> => {
  const { cognitoId } = req.params;
  const { name, email, phoneNumber } = req.body;

  try {
    const updatedManager = await prisma.manager.update({
      where: { cognitoId },
      data: { cognitoId, name, email, phoneNumber },
    });

    res.send(updatedManager);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating manager ' + error.message });
  }
}
