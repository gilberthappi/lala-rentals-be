import type { NextFunction } from "express";
import type { Request, Response } from "express";

export const appendPhotoAttachments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      req.body.thumbnail = files.find(
        (file) => file.fieldname == "thumbnail",
      )?.path;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const appendGallery = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.file) {
      req.body.gallery = req.file.path;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const appendImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.file) {
      req.body.image = req.file.path;
    }
    next();
  } catch (error) {
    next(error);
  }
};
