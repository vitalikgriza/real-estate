import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {wktToGeoJSON} from "@terraformer/wkt";

const prisma = new PrismaClient();

interface TenantRequestParams {
  cognitoId: string;
}

interface PropertyRequestParams {
  propertyId: string;
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


export const getCurrentResidences = async (req: Request<TenantRequestParams>, res: Response): Promise<void> => {
  const {cognitoId} = req.params;
  try {
    const tenant = await prisma.tenant.findUnique({
      where: {cognitoId},
    });
    if (!tenant) {
      res.status(404).json({message: 'Tenant not found'});
      return;
    }

    const properties = await prisma.property.findMany({
      where: {
        tenants: { some: {cognitoId} }
      },
      include: {
        location: true,
      },
    });

    const currentResidencesWithCoords = await Promise.all(properties.map(async (property) => {
      const coordinates : { coordinates: string} [] =  await prisma.$queryRaw`
          SELECT ST_AsText(l.coordinates) as coordinates
          FROM "Location" l
          WHERE id = ${property.locationId}
      `;
      const geoJSON = wktToGeoJSON(coordinates[0]?.coordinates || "");


      if (geoJSON && 'coordinates' in geoJSON) {
        const longitude = geoJSON?.coordinates[0];
        const latitude = geoJSON?.coordinates[1];

        return {
          ...property,
          location: {
            ...property.location,
            coordinates: {
              latitude,
              longitude,
            }
          }
        }
      }
      return property;
    }));

    res.json(currentResidencesWithCoords);

  } catch (err: any) {
      res.status(500).json({ message: 'Error retrieving current residences ' + err.message });
  }
}

export const addFavoriteProperty = async (req: Request<TenantRequestParams & PropertyRequestParams>, res: Response): Promise<void> => {
  const {cognitoId, propertyId} = req.params;
  const propertyIdNumber = Number(propertyId);
  try {
    const tenant = await prisma.tenant.findUnique({
      where: {cognitoId},
      include: {
        favorites: true,
      },
    });

    if (!tenant) {
      res.status(404).json({message: 'Tenant not found'});
      return;
    }

    const property = await prisma.property.findUnique({
      where: {id: propertyIdNumber},
    });

    if (!property) {
      res.status(404).json({message: 'Property not found'});
      return;
    }

    if (!tenant.favorites.some(fav => fav.id === propertyIdNumber)) {
      const updatedTenant = await prisma.tenant.update({
        where: {cognitoId},
        data: {
          favorites: {
            connect: {id: propertyIdNumber},
          },
        },
        include: {
          favorites: true,
        }
      });

      res.json(updatedTenant);
    } else {
      res.status(409).json({message: 'Property already in favorites'});
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Error adding favorite property ' + err.message });
  }
}

export const removeFavoriteProperty = async (req: Request<TenantRequestParams & PropertyRequestParams>, res: Response): Promise<void> => {
  const {cognitoId, propertyId} = req.params;
  const propertyIdNumber = Number(propertyId);
  try {
    const updatedTenant = await prisma.tenant.update({
      where: {cognitoId},
      data: {
        favorites: {
          disconnect: {id: propertyIdNumber},
        },
      },
      include: {
        favorites: true,
      }
    });

    res.json(updatedTenant);
  } catch (err: any) {
    res.status(500).json({ message: 'Error removing favorite property ' + err.message });
  }

}
