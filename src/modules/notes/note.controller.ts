import { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";

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

    const io = req.app.get("io");
    io.emit("new-note", result);

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

    const io = req.app.get("io");
    io.emit("note-updated", result);

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

const summarizeNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // return res.status(200).json({
    //   success: true,
    //   message: "AI Summary generated successfully!",
    //   data: null,
    // });
    const user = req.user as any;
    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: { id, userId: user.id },
    });

    if (!note) {
      throw new Error("Note not found or unauthorized!");
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Summarize the following note in 3 short bullet points. content: ${note.content}`;

    const aiResult = await model.generateContent(prompt);
    const response = await aiResult.response;
    const summaryText = response.text();

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        aiSummary: summaryText,
      },
    });

    res.status(200).json({
      success: true,
      message: "AI Summary generated successfully!",
      data: updatedNote,
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
  summarizeNote,
};
