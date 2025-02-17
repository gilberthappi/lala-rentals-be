import type { $Enums } from "@prisma/client";
import { TsoaResponse } from "tsoa";
export interface IResponse<T> {
  statusCode: number;
  message: string;
  error?: unknown;
  data?: T;
}

export type TUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  roles?: { id: number; role: string; userId: number }[];
};

export type RoleT = "ADMIN" | "HOST" | "RENTER";

export interface IUser extends Omit<TUser, "id" | "createdAt" | "updatedAt"> {}
export interface ILoginResponse
  extends Omit<TUser, "password" | "createdAt" | "updatedAt" | "roles"> {
  token: string;
  roles: $Enums.Role[];
}
export interface ILoginUser extends Pick<IUser, "email" | "password"> {}
export interface ISignUpUser
  extends Pick<
    IUser,
    "email" | "password" | "firstName" | "lastName" | "roles"
  > {}

export type TErrorResponse = TsoaResponse<
  400 | 401 | 500,
  IResponse<{ message: string }>
>;

export type TProperty = {
  id: number;
  userId: number;
  title: string;
  location: string;
  description: string;
  pricePerNight: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreatePropertyDto {
  userId: number;
  title: string;
  location: string;
  description: string;
  pricePerNight: string;
}

export type TBookings = {
  id: number;
  userId: number;
  propertyId: number;
  checkInDate: Date;
  checkOutDate: Date;
  bookingStatus: string;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreateBookingDto {
  userId: number;
  propertyId: number;
  checkInDate: Date;
  checkOutDate: Date;
  bookingStatus: string;
  totalPrice: number;
}

export interface IResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}
