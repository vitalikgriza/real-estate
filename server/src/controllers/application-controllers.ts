import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateNextPaymentDate } from "../utils/calculateNextPaymentDate";

const prisma = new PrismaClient({
  log: ['query'],
});

export const listApplications = async (req: Request, res: Response) => {
  const { userId, userType  } = req.query;
  try {
    let whereClause = {};
    if (userType === 'manager') {
      whereClause = {
        where: {
          property: {
            managerCognitoId: userId,
          }
        }
      }
    } else if (userType === 'tenant') {
      whereClause = {
        where : { tenantCognitoId: userId },
      }
    }

    const applications = await prisma.application.findMany({
      ...whereClause,
      include: {
        property: {
          include: {
            manager: true,
            location: true,
          }
        },
        tenant: true,
      }
    });


    const formatApplications = await Promise.all(applications.map(async (application) => {
      const lease = await prisma.lease.findFirst({
        where: {
          tenantCognitoId: application.tenantCognitoId,
          propertyId: application.propertyId,
        },
        orderBy: { startDate: 'desc' },
      });

      return {
        ...application,
        property: {
          ...application.property,
          address: application.property.location.address,
        },
        manager: application.property.manager,
        lease: lease ? {
          ...lease,
          nextPaymentDate: calculateNextPaymentDate(lease.startDate)
        } : null,
      }
    }))

    res.json(formatApplications);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving applications ' + (error as Error).message });
  }
}


export const createApplication = async (req: Request, res: Response) => {
  const {
    tenantCognitoId,
    propertyId,
    message,
    name,
    email,
    phoneNumber,
    status,
  } = req.body;
  try {

    const property = await prisma.property.findUnique({
      where: { id: Number(propertyId) },
      select: {
        pricePerMonth: true,
        securityDeposit: true,
      }
    });

    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    const newApplication = await prisma.$transaction(async () => {
      const lease = await prisma.lease.create({
        data: {
          tenantCognitoId,
          propertyId: Number(propertyId),
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year lease
          deposit: property.securityDeposit,
          rent: property.pricePerMonth
        },
      });
      return prisma.application.create({
        data: {
          tenant: {
            connect: { cognitoId: tenantCognitoId }
          },
          property: {
            connect: { id: Number(propertyId) }
          },
          message,
          name,
          email,
          phoneNumber,
          status,
          applicationDate: new Date(),
          lease: {
            connect: { id: lease.id }
          }
        },
      });
    });

    res.status(201).json(newApplication);

  } catch (error) {
    res.status(500).json({ message: 'Error creating application ' + (error as Error).message });
  }
}


export const updateApplicationStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: {
        property: true,
        tenant: true
      }
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (status === "Approved") {
      const newLease = await prisma.lease.create({
        data: {
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year lease
          rent: application.property.pricePerMonth,
          deposit: application.property.securityDeposit,
          tenantCognitoId: application.tenantCognitoId,
          propertyId: application.propertyId
        }
      });

      // Update the property to connect the tenant
      await prisma.property.update({
        where: { id: application.propertyId },
        data: {
          tenants: {
            connect: { cognitoId: application.tenantCognitoId }
          }
        }
      });

      // Update the application status and lease
      await prisma.application.update({
        where: { id: Number(id) },
        data: {
          status,
          leaseId: newLease.id
        },
        include: {
          property: true,
          tenant: true,
          lease: true,
        }
      })


    } else {
      await prisma.application.update({
        where: {id: Number(id)},
        data: {status},
      });
    }

    const updatedApplication = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: {
        property: true,
        tenant: true,
        lease: true,
      }
    });

    res.json(updatedApplication);

  } catch (error) {
    res.status(500).json({ message: 'Error updating application status ' + (error as Error).message });
  }
}
