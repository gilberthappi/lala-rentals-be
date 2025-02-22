import { PrismaClient } from "@prisma/client";
import { BaseService } from "./Service";
import {
  CreateBookingDto,
  TBookings,
  IResponse,
} from "../utils/interfaces/common";
import AppError from "../utils/error";

const prisma = new PrismaClient();

export class BookingService extends BaseService {
  // Create a new booking
  public async createBooking(
    bookingData: CreateBookingDto,
  ): Promise<IResponse<TBookings>> {
    try {
      const { propertyId, checkInDate, checkOutDate } = bookingData;
      const userId = this.request.user!.id;

      // Check if a booking already exists for the user and property
      const existingBooking = await prisma.bookings.findFirst({
        where: { propertyId, userId },
      });

      if (existingBooking) {
        // Update existing booking
        const updatedBooking = await prisma.bookings.update({
          where: { id: existingBooking.id },
          data: { checkInDate, checkOutDate },
        });

        return {
          statusCode: 200,
          message: "Booking updated successfully",
          data: updatedBooking,
        };
      }

      // Retrieve property details
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new AppError("Property not found", 404);
      }

      // Ensure pricePerNight is a valid number
      const pricePerNight = Number(property.pricePerNight);

      if (isNaN(pricePerNight)) {
        throw new AppError("Invalid property price per night", 400);
      }

      // Calculate total price based on the number of nights
      const totalNights = this.calculateNights(checkInDate, checkOutDate);
      const totalPrice = totalNights * pricePerNight;

      // Create a new booking
      const newBooking = await prisma.bookings.create({
        data: { userId, propertyId, checkInDate, checkOutDate, totalPrice },
      });

      return {
        statusCode: 201,
        message: "Booking created successfully",
        data: newBooking,
      };
    } catch (error) {
      throw new AppError("Internal Server Error", 500);
    }
  }

  // Helper function to calculate the number of nights
  private calculateNights(checkIn: Date, checkOut: Date): number {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    return Math.ceil(
      Math.abs(checkOutDate.getTime() - checkInDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }

  // Get booking by ID
  static async getBookingById(
    id: number,
  ): Promise<IResponse<TBookings | null>> {
    try {
      const booking = await prisma.bookings.findUnique({
        where: { id },
        include: {
          property: {
            include: {
              user: true,
            },
          },
        },
      });
      if (booking) {
        return { statusCode: 200, message: "Booking found", data: booking };
      }
      return { statusCode: 404, message: "Booking not found" };
    } catch (error) {
      return { statusCode: 500, message: "Failed to fetch booking", error };
    }
  }

  // Get all bookings
  static async getAllBookings(): Promise<IResponse<TBookings[]>> {
    try {
      const bookings = await prisma.bookings.findMany();
      return {
        statusCode: 200,
        message: "Bookings fetched successfully",
        data: bookings,
      };
    } catch (error) {
      return { statusCode: 500, message: "Failed to fetch bookings", error };
    }
  }

  public static async getAllMyBookings(
    userId: number,
  ): Promise<IResponse<TBookings[]>> {
    try {
      const booking = await prisma.bookings.findMany({
        where: {
          userId: userId,
        },
        include: {
          property: {
            include: {
              user: true,
            },
          },
        },
      });

      return {
        statusCode: 200,
        message: "bookings fetched successfully",
        data: booking,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  // Update booking status
  static async updateBookingStatus(
    id: number,
    bookingStatus: string,
  ): Promise<IResponse<TBookings | null>> {
    try {
      const booking = await prisma.bookings.update({
        where: { id },
        data: { bookingStatus: bookingStatus },
      });
      return {
        statusCode: 200,
        message: "Booking status updated successfully",
        data: booking,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: "Failed to update booking status",
        error,
      };
    }
  }

  // Delete booking by ID
  static async deleteBooking(id: number): Promise<IResponse<null>> {
    try {
      await prisma.bookings.delete({ where: { id } });
      return { statusCode: 200, message: "Booking deleted successfully" };
    } catch (error) {
      return { statusCode: 500, message: "Failed to delete booking", error };
    }
  }
  public static async BookingByMonth(
    userId: number,
    year: number,
  ): Promise<IResponse<number[]>> {
    try {
      const properties = await prisma.property.findMany({
        where: { userId },
        select: { id: true },
      });

      if (properties.length === 0) {
        throw new AppError("No properties found for the user", 404);
      }

      const propertyIds = properties.map((property) => property.id);

      const bookings = await prisma.bookings.findMany({
        where: {
          propertyId: { in: propertyIds },
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
          bookingStatus: "confirmed",
        },
        select: {
          createdAt: true,
        },
      });

      const bookingsByMonth = Array(12).fill(0);

      bookings.forEach((book) => {
        const month = new Date(book.createdAt).getMonth();
        bookingsByMonth[month]++;
      });

      return {
        message: "Confirmed booking count by month fetched successfully",
        statusCode: 200,
        data: bookingsByMonth,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  public static async UnconfirmedBookingByMonth(
    userId: number,
    year: number,
  ): Promise<IResponse<number[]>> {
    try {
      const properties = await prisma.property.findMany({
        where: { userId },
        select: { id: true },
      });

      if (properties.length === 0) {
        throw new AppError("No properties found for the user", 404);
      }

      const propertyIds = properties.map((property) => property.id);

      const bookings = await prisma.bookings.findMany({
        where: {
          propertyId: { in: propertyIds },
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
          bookingStatus: "Pending",
        },
        select: { createdAt: true },
      });

      const bookingsByMonth = Array(12).fill(0);

      bookings.forEach((book) => {
        const month = new Date(book.createdAt).getMonth();
        bookingsByMonth[month]++;
      });

      return {
        message: "Unconfirmed booking count by month fetched successfully",
        statusCode: 200,
        data: bookingsByMonth,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }
}
