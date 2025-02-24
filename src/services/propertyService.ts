import { BaseService } from "./Service";
import { prisma } from "../utils/client";
import {
  TProperty,
  IResponse,
  CreatePropertyDto,
} from "../utils/interfaces/common";
import AppError from "../utils/error";

export class PropertyService extends BaseService {
  public async createProperty(
    property: CreatePropertyDto,
  ): Promise<IResponse<TProperty>> {
    try {
      const newProperty = await prisma.property.create({
        data: {
          title: property.title,
          userId: this.request.user!.id,
          location: property.location,
          description: property.description,
          pricePerNight: property.pricePerNight,
          bedrooms: property.bedrooms ?? null,
          bathrooms: property.bathrooms ?? null,
          size: property.size ?? null,
          thumbnail:
            typeof property.thumbnail === "string"
              ? property.thumbnail
              : undefined,
          gallery: property.gallery as string[],
        },
      });
      return {
        statusCode: 201,
        message: "Property created successfully",
        data: newProperty,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  public static async getProperty(
    propertyId: number,
  ): Promise<IResponse<TProperty>> {
    try {
      const property = await prisma.property.findUnique({
        where: {
          id: propertyId,
        },
        include: {
          bookings: true,
          user: true,
        },
      });

      if (!property) {
        throw new AppError("property post not found", 404);
      }

      return {
        statusCode: 200,
        message: "property post fetched successfully",
        data: property,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  public static async getAllPropeties(): Promise<IResponse<TProperty[]>> {
    try {
      const properties = await prisma.property.findMany({
        include: {
          bookings: {
            include: {
              user: true,
            },
          },
          user: true,
        },
      });

      return {
        statusCode: 200,
        message: "properties fetched successfully",
        data: properties,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  public static async getAllMyPropeties(
    userId: number,
  ): Promise<IResponse<TProperty[]>> {
    try {
      const properties = await prisma.property.findMany({
        where: {
          userId: userId,
        },
        include: {
          bookings: {
            include: {
              user: true,
            },
          },
        },
      });

      return {
        statusCode: 200,
        message: "properties posts fetched successfully",
        data: properties,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  public static async hostPropertByMonth(
    userId: number,
    year: number,
  ): Promise<IResponse<number[]>> {
    try {
      const properties = await prisma.property.findMany({
        where: {
          userId: userId,
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
        },
        select: {
          createdAt: true,
        },
      });

      const propertyByMonth = Array(12).fill(0);

      properties.forEach((property) => {
        const month = new Date(property.createdAt).getMonth();
        propertyByMonth[month]++;
      });

      return {
        message: "Properties post count by month fetched successfully",
        statusCode: 200,
        data: propertyByMonth,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  public static async propertyByMonth(
    year: number,
  ): Promise<IResponse<number[]>> {
    try {
      const properties = await prisma.property.findMany({
        where: {
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
        },
        select: {
          createdAt: true,
        },
      });

      const propertiesByMonth = Array(12).fill(0);

      properties.forEach((property) => {
        const month = new Date(property.createdAt).getMonth(); // Get the month (0-based)
        propertiesByMonth[month]++;
      });

      return {
        message: "Property post count by month fetched successfully",
        statusCode: 200,
        data: propertiesByMonth,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  public static async updateProperty(
    propertyId: number,
    propertyData: Partial<CreatePropertyDto>,
  ): Promise<IResponse<TProperty>> {
    try {
      const updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: {
          ...propertyData,
          thumbnail:
            typeof propertyData.thumbnail === "string"
              ? propertyData.thumbnail
              : undefined,
          gallery: propertyData.gallery as string[],
        },
      });
      return {
        statusCode: 200,
        message: "Property post updated successfully",
        data: updatedProperty,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  public static async deleteProperty(
    propertyId: number,
  ): Promise<IResponse<null>> {
    try {
      await prisma.property.delete({ where: { id: propertyId } });
      return {
        statusCode: 200,
        message: "Property post deleted successfully",
        data: null,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }
}
