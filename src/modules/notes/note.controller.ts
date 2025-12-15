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

export const NoteControllers = {
  createNote,
  getAllNotes,
};
