import {Location, Prisma, PrismaClient} from "@prisma/client";
import {Request, Response} from 'express';
import {wktToGeoJSON} from "@terraformer/wkt";
import {Upload} from "@aws-sdk/lib-storage";
import {S3Client} from "@aws-sdk/client-s3";
import axios from "axios";

const prisma = new PrismaClient({
  log: ['query'],
});
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
});

export const getProperties = async (req: Request, res: Response) => {
 try {
   const {
     favoriteIds,
     priceMin,
     priceMax,
     beds,
     baths,
     propertyType,
     squareFeetMin,
     squareFeetMax,
     amenities,
     availableFrom,
     latitude,
     longitude,
   } = req.query;

   let whereConditions: Prisma.Sql[] = [];

   if (favoriteIds) {
     const favoriteIdsArray = (favoriteIds as string).split(',').map(Number);
     whereConditions.push(
       Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`
     );
   }

   if (priceMin) {
     whereConditions.push(Prisma.sql`p."pricePerMonth" >= ${Number(priceMin)}`);
   }

   if (priceMax) {
     whereConditions.push(Prisma.sql`p."pricePerMonth" <= ${Number(priceMax)}`);
   }

   if (beds && beds !== 'any') {
     whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
   }

   if (baths && baths !== 'any') {
     whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
   }

   if (squareFeetMin) {
     whereConditions.push(Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`);
   }

   if (squareFeetMax) {
     whereConditions.push(Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`);
   }

   if (propertyType && propertyType !== 'any') {
     whereConditions.push(Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`);
   }

   if (amenities) {
     const amenitiesArray = (amenities as string).split(',');
     whereConditions.push(
       Prisma.sql`p."amenities" @> ${amenitiesArray}::"Amenity"[]`
     );
   }

   if (availableFrom) {
     const availableFromDate = availableFrom ? new Date(availableFrom as string) : null;
     if (availableFromDate) {
       const date = new Date(availableFromDate);
       console.log('Parsed availableFrom date:', date.toISOString());
       if (!isNaN(date.getTime())) {
         whereConditions.push(
           Prisma.sql`EXISTS (
            SELECT 1 FROM "Lease" l
            WHERE l."propertyId" = p.id
            AND l."startDate" >= ${date.toISOString()}::timestamp
          )`
         );
       }
     }
   }

   if (latitude && longitude) {
     const lat = parseFloat(latitude as string);
     const lng = parseFloat(longitude as string);
     const radiusInKm = 1000;
     const degrees = radiusInKm / 111

     whereConditions.push(
       Prisma.sql`ST_DWithin(
       l.coordinates::geometry,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${degrees}
        )`
     )
   }

   const completeQuery = Prisma.sql`
     SELECT p.*,
     json_build_object(
        'id', l.id,
        'address', l.address,
        'city', l.city,
        'state', l.state,
        'country', l.country,
        'postalCode', l."postalCode",
        'coordinates', json_build_object(
          'latitude', ST_Y(l.coordinates::geometry),
          'longitude', ST_X(l.coordinates::geometry)
          )
        ) as location
        FROM "Property" p
        JOIN "Location" l ON p."locationId" = l.id
        ${whereConditions.length ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}` : Prisma.empty}
   `;

   const properties = await prisma.$queryRaw(completeQuery);

   res.json(properties);
 } catch (err) {
   res.status(500).json({ message: 'Error retrieving properties ' + (err as Error).message });
 }
}

export const getPropertyLeases = async (req: Request, res: Response) => {
  const {id} = req.params;
  try {
    const leases = await prisma.lease.findMany({
      where: {propertyId: Number(id)},
      include: {
        tenant: true,
      },
      orderBy: {
        startDate: 'desc',
      }
    });

    res.json(leases);
  } catch (err: any) {
    res.status(500).json({message: 'Error retrieving leases ' + err.message});
  }
}


export const getProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
      include: {
        location: true,
      },
    });

    if (property) {
      const coordinates : { coordinates: string} [] =  await prisma.$queryRaw`
        SELECT ST_AsText(l.coordinates) as coordinates
        FROM "Location" l
        WHERE id = ${property.locationId}
      `;
      const geoJSON = wktToGeoJSON(coordinates[0]?.coordinates || "");


      if (geoJSON && 'coordinates' in geoJSON) {
        const longitude = geoJSON?.coordinates[0];
        const latitude = geoJSON?.coordinates[1];

        const propertyWithCoords = {
          ...property,
          location: {
            ...property.location,
            coordinates: {
              latitude,
              longitude,
            }
          }
        }
        return res.json(propertyWithCoords);
      }

      res.json(property);
    }

  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving property ' + err.message });
  }
}

export const createProperty = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    const {
      address,
      city,
      state,
      country,
      postalCode,
      managerCognitoId,
      ...propertyData
    } = req.body;

    const photoUrls = await Promise.all(
      files.map(async file => {
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: `properties/${Date.now()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        }
        const uploadResult = await new Upload({
          client: s3Client,
          params: uploadParams,
        }).done();

        return uploadResult.Location
      })
    )

    const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      street: address,
      city,
      state,
      country,
      postalcode: postalCode,
      format: 'json',
      limit: '1'
    }).toString()}`;

    const geocodingResponse = await axios(geocodingUrl, {
      headers: {
        'User-Agent': 'RealEstateApp/1.0 (vitalikgriza@gmail.com)'
      }
    });

    const [longitude, latitude] = geocodingResponse.data[0].lat && geocodingResponse.data[0].lon
      ? [parseFloat(geocodingResponse.data[0].lon), parseFloat(geocodingResponse.data[0].lat)]
      : [0, 0];

    const [location] = await prisma.$queryRaw<Location[]>`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates) 
      VALUES (${address}, ${city}, ${state}, ${country}, ${postalCode}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
      RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
    `;

    const newProperty = await prisma.property.create({
      data: {
        ...propertyData,
        photoUrls,
        locationId: location?.id,
        managerCognitoId,
        amenities: typeof propertyData.amenities === 'string'
          ? propertyData.amenities.split(',').map((amenity: string) => amenity.trim())
          : [],
        highlights: typeof propertyData.highlights === 'string'
          ? propertyData.highlights.split(',').map((highlight: string) => highlight.trim())
          : [],
        isPetsAllowed : propertyData.isPetsAllowed === 'true',
        isParkingIncluded: propertyData.isParkingIncluded === 'true',
        pricePerMonth: parseFloat(propertyData.pricePerMonth),
        securityDeposit: parseFloat(propertyData.securityDeposit),
        beds: parseInt(propertyData.beds, 10),
        baths: parseInt(propertyData.baths, 10),
        squareFeet: parseInt(propertyData.squareFeet, 10),
        applicationFee: parseFloat(propertyData.applicationFee),
      },
      include: {
        location: true,
        manager: true,
      }
    });

    return res.json(newProperty);

  } catch (err: any) {
    res.status(500).json({ message: 'Error creating property ' + err.message });
  }
}
