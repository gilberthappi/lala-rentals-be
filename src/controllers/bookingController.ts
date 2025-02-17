/* eslint-disable @typescript-eslint/no-explicit-any */
import { Middlewares } from "tsoa";
import {
  Body,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Route,
  Tags,
  Security,
  Request,
} from "tsoa";
import { BookingService } from "../services/bookingService";
import {
  TBookings,
  IResponse,
  CreateBookingDto,
} from "../utils/interfaces/common";
import { Request as Req } from "express";
import { checkRole } from "../middlewares";
import { roles } from "../utils/roles";
import AppError from "../utils/error";
import { Request as ExpressRequest } from "express";

@Tags("Bookings")
@Route("/api/booking")
export class BookingController {
  @Get("/booking/host/{year}")
  @Security("jwt")
  @Middlewares(checkRole(roles.HOST))
  public async getBookingEventCountByMonth(
    @Request() request: ExpressRequest,
    @Path() year: number,
  ) {
    const userId = request.user!.id;
    if (!userId) {
      throw new AppError("Host ID is missing", 400);
    }
    return BookingService.BookingByMonth(Number(userId), year);
  }
  @Post("/")
  @Security("jwt")
  public async createBooking(
    @Body() bookingData: CreateBookingDto,
    @Request() request: Req,
  ): Promise<IResponse<TBookings>> {
    if (!request.user) {
      throw new AppError("User not authenticated", 401);
    }
    return new BookingService(request).createBooking(bookingData);
  }

  @Get("/{id}")
  public async getBooking(
    @Path() id: number,
  ): Promise<IResponse<TBookings | null>> {
    const booking = await BookingService.getBookingById(id);
    return {
      statusCode: booking.statusCode,
      message: booking.message,
      data: booking.data,
    };
  }

  @Get("/")
  public async getAllBookings(): Promise<IResponse<TBookings[]>> {
    const bookings = await BookingService.getAllBookings();
    return {
      statusCode: bookings.statusCode,
      message: bookings.message,
      data: bookings.data,
    };
  }

  @Put("/{id}")
  @Security("jwt")
  @Middlewares(checkRole(roles.HOST))
  public async updateBookingStatus(
    @Path() id: number,
    @Body() statusUpdate: { bookingStatus: string },
  ): Promise<IResponse<TBookings | null>> {
    const response = await BookingService.updateBookingStatus(
      id,
      statusUpdate.bookingStatus,
    );
    return {
      statusCode: response.statusCode,
      message: response.message,
      data: response.data,
    };
  }

  @Delete("/{id}")
  public async deleteBooking(@Path() id: number): Promise<IResponse<null>> {
    const response = await BookingService.deleteBooking(id);
    return {
      statusCode: response.statusCode,
      message: response.message,
      data: null,
    };
  }
}
