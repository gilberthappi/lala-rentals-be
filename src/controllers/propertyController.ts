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
import { PropertyService } from "../services/propertyService";
import {
  TProperty,
  IResponse,
  CreatePropertyDto,
} from "../utils/interfaces/common";
import { Request as Req } from "express";
import { checkRole } from "../middlewares";
import { roles } from "../utils/roles";
import AppError from "../utils/error";
import { Request as ExpressRequest } from "express";
import {
  appendPhotoAttachments,
  appendGallery,
} from "../middlewares/fileHandler";
import upload from "../utils/cloudinary";

@Tags("Properties")
@Route("/api/property")
export class PropertyController {
  @Get("/my")
  @Security("jwt")
  @Middlewares(checkRole(roles.HOST))
  public async getAllMyPropeties(
    @Request() request: Req,
  ): Promise<IResponse<TProperty[]>> {
    if (!request.user) {
      throw new AppError("User not authenticated", 401);
    }
    const userId = request.user!.id;
    return PropertyService.getAllMyPropeties(userId);
  }

  @Get("/properties/host/{year}")
  @Security("jwt")
  @Middlewares(checkRole(roles.HOST))
  public async hostPropertByMonth(
    @Request() request: ExpressRequest,
    @Path() year: number,
  ) {
    const userId = request.user!.id;
    if (!userId) {
      throw new AppError("User ID is missing", 400);
    }
    return PropertyService.hostPropertByMonth(Number(userId), year);
  }

  @Get("/all/all/{year}")
  @Security("jwt")
  @Middlewares(checkRole(roles.ADMIN))
  public async propertyByMonth(
    @Request() request: ExpressRequest,
    @Path() year: number,
  ) {
    return PropertyService.propertyByMonth(year);
  }

  @Get("/")
  public async getAllPropeties(): Promise<IResponse<TProperty[]>> {
    return PropertyService.getAllPropeties();
  }

  @Get("/{id}")
  public async getProperty(
    @Path() id: number,
  ): Promise<IResponse<TProperty | null>> {
    return PropertyService.getProperty(id);
  }

  @Post("/")
  @Security("jwt")
  @Middlewares(
    checkRole(roles.HOST),
    upload.any(),
    appendPhotoAttachments,
    appendGallery,
  )
  public async createProperty(
    @Body() property: CreatePropertyDto,
    @Request() request: Req,
  ): Promise<IResponse<TProperty>> {
    return new PropertyService(request).createProperty(property);
  }

  @Put("/{id}")
  @Security("jwt")
  @Middlewares(
    checkRole(roles.HOST),
    upload.any(),
    appendPhotoAttachments,
    appendGallery,
  )
  public async updateProperty(
    @Path() id: number,
    @Body() propertyData: CreatePropertyDto,
  ): Promise<IResponse<TProperty | null>> {
    return PropertyService.updateProperty(id, propertyData);
  }

  @Delete("/{id}")
  @Security("jwt")
  @Middlewares(checkRole(roles.HOST))
  public async deleteProperty(@Path() id: number): Promise<IResponse<null>> {
    await PropertyService.deleteProperty(id);
    return {
      statusCode: 200,
      message: "Property post deleted successfully",
    };
  }
}
