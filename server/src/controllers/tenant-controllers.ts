import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TenantRequestParams {
  cognitoId: string;
}

export const getTenant = async (req: Request<TenantRequestParams>, res: Response): Promise<void> => {
    const { cognitoId } = req.params;

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { cognitoId },
        include: {
          favorites: true
        }
      });

      if (tenant) {
        res.status(200).json(tenant);
      } else {
        res.status(404).json({ message: 'No tenant found' });
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Error retrieving tenant ' + error.message });
    }
  }

  export const createTenant = async (req: Request, res: Response): Promise<void> => {
    const { cognitoId, name, email, phoneNumber } = req.body;

    try {
      const tenant = await prisma.tenant.create({
        data: { cognitoId, name, email, phoneNumber},
      });

      res.status(201).send(tenant);
    } catch (error: any) {
      res.status(500).json({ message: 'Error create tenant ' + error.message });
    }
  }



export const updateTenant = async (req: Request<TenantRequestParams>, res: Response): Promise<void> => {
  const { cognitoId } = req.params;
  const { name, email, phoneNumber } = req.body;

  try {
    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId },
      data: { name, email, phoneNumber},
    });

    res.send(updatedTenant);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating tenant ' + error.message });
  }
}
