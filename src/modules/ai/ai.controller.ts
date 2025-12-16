import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db";
import { chatModel, getEmbedding } from "../../utils/ai";

export const chatWithNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { question } = req.body;
    const user = req.user as any;
    const userId = user.id;

    if (!question) {
      return res.status(400).json({ message: "Question required" });
    }

    const queryVector = await getEmbedding(question);

    const vectorString = `[${queryVector.join(",")}]`;

    const relevantNotes = await prisma.$queryRaw`
      SELECT id, title, content
      FROM "Note"
      WHERE "userId" = ${userId}
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT 3
    `;

    const notesList = relevantNotes as { title: string; content: string }[];

    if (notesList.length === 0) {
      return res.json({
        success: true,
        answer: "I couldn't find any relevant notes in your account.",
      });
    }

    const context = notesList
      .map((n) => `Title: ${n.title}\nContent: ${n.content}`)
      .join("\n\n");

    const prompt = `
      You are a helpful assistant. Answer the user's question based ONLY on the context below.
      
      User Question: ${question}
      
      Context (User's Notes):
      ${context}
    `;

    const result = await chatModel.generateContent(prompt);
    res.json({ success: true, answer: result.response.text() });
  } catch (error) {
    next(error);
  }
};
