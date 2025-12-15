import { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db";

const createNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    const { tags, ...noteData } = req.body;

    const result = await prisma.note.create({
      data: {
        ...noteData,
        userId: user.id,

        tags:
          tags && tags.length > 0
            ? {
                connectOrCreate: tags.map((tag: string) => ({
                  where: { name: tag },
                  create: { name: tag },
                })),
              }
            : undefined,
      },
      include: {
        tags: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Note created successfully!",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getAllNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [result, total] = await Promise.all([
      prisma.note.findMany({
        where: { userId: user.id },
        include: { tags: true },
        orderBy: { createdAt: "desc" },
        skip: skip,
        take: limit,
      }),
      prisma.note.count({
        where: { userId: user.id },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Notes retrieved successfully!",
      total,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getSingleNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    const result = await prisma.note.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: { tags: true },
    });

    if (!result) {
      throw new Error("Note not found or you are not authorized!");
    }

    res.status(200).json({
      success: true,
      message: "Note retrieved successfully!",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    const { tags, ...updateData } = req.body;

    const noteExists = await prisma.note.findFirst({
      where: { id, userId: user.id },
    });

    if (!noteExists) {
      throw new Error("Note not found or unauthorized!");
    }

    const result = await prisma.note.update({
      where: { id },
      data: {
        ...updateData,
        tags: tags
          ? {
              set: [],
              connectOrCreate: tags.map((tag: string) => ({
                where: { name: tag },
                create: { name: tag },
              })),
            }
          : undefined,
      },
      include: { tags: true },
    });

    res.status(200).json({
      success: true,
      message: "Note updated successfully!",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    const { id } = req.params;

    const result = await prisma.note.deleteMany({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      throw new Error("Note not found or unauthorized!");
    }

    res.status(200).json({
      success: true,
      message: "Note deleted successfully!",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const NoteControllers = {
  createNote,
  getAllNotes,
  getSingleNote,
  updateNote,
  deleteNote,
};
