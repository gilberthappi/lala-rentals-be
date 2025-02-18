/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../utils/client";
import {
  IUser,
  IResponse,
  ILoginUser,
  ISignUpUser,
} from "../utils/interfaces/common";
import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import AppError from "../utils/error";
import { randomBytes } from "crypto";
import { sendEmail } from "../utils/email";
import { hash } from "bcrypt";
import { roles } from "../utils/roles";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class UserService {
  public static async getUsers(): Promise<IResponse<IUser[]>> {
    try {
      const users = await prisma.user.findMany();
      return {
        message: "welcome",
        statusCode: 200,
        data: users,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  public static async loginUser(user: ILoginUser) {
    try {
      const userData = await prisma.user.findFirst({
        where: { email: user.email },
        include: {
          roles: true,
        },
      });
      if (!userData) {
        throw new AppError("user account not found ", 401);
      }

      const isPasswordSimilar = await compare(user.password, userData.password);
      if (isPasswordSimilar) {
        const token = jwt.sign(user.email, process.env.JWT_SECRET!);
        const userRoles = userData.roles.map((roleRecord) => roleRecord.role);
        return {
          message: "Login successful",
          statusCode: 200,
          data: {
            token,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            id: userData.id,
            roles: userRoles,
          },
        };
      }
      throw new AppError("user account with email or password not found", 401);
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  // user signup
  public static async signUpUser(user: ISignUpUser) {
    try {
      // Check if user already exists
      const userExists = await prisma.user.findFirst({
        where: { email: user.email },
      });
      if (userExists) {
        throw new AppError("User already exists", 409);
      }

      // Hash password
      const hashedPassword = await hash(user.password, 10);
      const token = jwt.sign(user.email, process.env.JWT_SECRET!);
      // Use a transaction to create the user and assign the default role
      await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: hashedPassword,
          },
        });

        if (!createdUser) {
          throw new Error("Failed to create user");
        }

        const assignRole = await tx.userRoles.create({
          data: {
            userId: createdUser.id,
            role: roles.RENTER,
          },
        });

        if (!assignRole) {
          throw new Error("Failed to assign role to user");
        }
      });

      return {
        message: "User created successfully",
        data: {
          token,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: [roles.RENTER],
        },
        statusCode: 201,
      };
    } catch (error) {
      throw new AppError("Internal Server Error", 500);
    }
  }
  // Method to request otp
  public static async requestPasswordReset(email: string) {
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Generate a 6-digit OTP
    const otp = randomBytes(3).toString("hex").toUpperCase();
    const otpExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // OTP expires in 60 minutes

    // Update the user with OTP and expiration time
    await prisma.user.update({
      where: { email },
      data: { otp, otpExpiresAt },
    });

    // Send OTP via email (implement sendEmail utility)
    await sendEmail({
      to: user.email,
      subject: "Password Reset - One-Time Password (OTP)",
      body: `
    Dear ${user.firstName || "User"},

    You have requested to reset your password. Please use the following One-Time Password (OTP) to proceed with the password reset process:

    OTP: ${otp}

    This OTP is valid for a limited time. If you did not request a password reset, please disregard this email.

    Best regards,
    LALA RENTAL BOOKING Support Team
  `,
    });

    return { message: "OTP sent to your email " };
  }

  // Method to reset password
  public static async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (
      !user.otp ||
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);

    // Update the user with the new password and clear OTP fields
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, otp: null, otpExpiresAt: null },
    });

    return { message: "Password reset successfully" };
  }
  public static async deleteUser(id: number) {
    try {
      // Check if the user exists and include related records
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          roles: true,
        },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Start a transaction to ensure all deletions succeed or fail together
      await prisma.$transaction(async (prisma) => {
        // Delete the user's roles
        await prisma.userRoles.deleteMany({
          where: { userId: id },
        });

        // Delete the user
        await prisma.user.delete({
          where: { id },
        });
      });

      return { message: "User deleted successfully" };
    } catch (error) {
      throw new AppError("Error deleting user", 500);
    }
  }

  // Get users count by month, filtered by year
  public static async getUsersCountByMonth(
    year: number,
  ): Promise<IResponse<any>> {
    try {
      const users = await prisma.user.findMany({
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
      // Initialize an array with 12 months (0 for each month)
      const usersCountByMonth = Array(12).fill(0);
      // Group by month using JavaScript
      users.forEach((user) => {
        const month = new Date(user.createdAt).getMonth(); // getMonth returns 0-based month
        usersCountByMonth[month]++;
      });

      return {
        message: "Users count by month fetched successfully",
        statusCode: 200,
        data: usersCountByMonth,
      };
    } catch (error) {
      throw new AppError("Error fetching users count by month", 500);
    }
  }

  public static async googleAuthenticate(token: string) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new AppError("Invalid Google token", 401);
      }

      const { email, given_name, family_name } = payload!;
      if (!email) {
        throw new AppError("Email not found in Google token", 401);
      }

      if (!given_name || !family_name) {
        throw new AppError("Names not found in Google token", 401);
      }

      const userExists = await prisma.user.findFirst({
        where: { email },
        include: { roles: true },
      });

      if (!userExists) {
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              firstName: given_name,
              lastName: family_name,
              email,
              password: "",
            },
          });

          await tx.userRoles.create({
            data: {
              userId: user.id,
              role: roles.RENTER,
            },
          });
        });
      }

      const jwtToken = jwt.sign(
        { email: userExists!.email },
        process.env.JWT_SECRET!,
      );

      return {
        message: "Google authentication successful",
        statusCode: 200,
        data: {
          token: jwtToken,
          firstName: userExists!.firstName,
          lastName: userExists!.lastName,
          email: userExists!.email,
          id: userExists!.id,
          roles: userExists!.roles.map((roleRecord) => roleRecord.role) || [],
        },
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }
  //update user role
  public static async updateUserRole(id: number): Promise<IResponse<any>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { roles: true },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.roles[0].role === roles.HOST) {
        const updateRenter = await prisma.userRoles.update({
          where: { id: user.roles[0].id },
          data: {
            role: roles.RENTER,
          },
        });
        return {
          message: "User role updated successfully",
          statusCode: 200,
          data: updateRenter,
        };
      }

      // Add the role to the user
      const updatedHost = await prisma.userRoles.update({
        where: { id: user.roles[0].id },
        data: {
          id,
          role: roles.HOST,
        },
      });

      return {
        message: "User role updated successfully",
        statusCode: 200,
        data: updatedHost,
      };
    } catch (error) {
      throw new AppError(error, 500);
    }
  }
}
