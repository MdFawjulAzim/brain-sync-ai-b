import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db";
import { GPT_MODEL, openai } from "../../utils/openai";

// 1. Generate Quiz
export const generateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { noteId } = req.body;
    const user = req.user as any;
    const userId = user.id;

    let contentToQuiz = "";

    // If note ID is provided, use that note; otherwise, use the latest 3 notes
    if (noteId) {
      const note = await prisma.note.findUnique({ where: { id: noteId } });
      if (!note) throw new Error("Note not found");
      contentToQuiz = note.content;
    } else {
      const notes = await prisma.note.findMany({
        where: { userId },
        take: 3,
        orderBy: { createdAt: "desc" },
      });
      contentToQuiz = notes.map((n) => n.content).join("\n\n");
    }

    if (!contentToQuiz) throw new Error("No content found to generate quiz.");

    // Ask OpenAI to respond in JSON format
    const prompt = `
      Create a quiz with 5 multiple-choice questions based on the following content.
      Return the output strictly in this JSON format:
      {
        "title": "A suitable title for the quiz",
        "questions": [
          {
            "questionText": "Question here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A"
          }
        ]
      }
      
      Content:
      ${contentToQuiz}
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GPT_MODEL, // or "gpt-4o"
      response_format: { type: "json_object" }, // JSON Mode (very important)
    });

    const quizData = JSON.parse(completion.choices[0].message.content || "{}");

    // Save to database
    const newQuiz = await prisma.quiz.create({
      data: {
        title: quizData.title,
        userId,
        total: quizData.questions.length,
        questions: {
          create: quizData.questions.map((q: any) => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
        },
      },
      include: { questions: true }, // Return with questions for frontend
    });

    res.status(201).json({ success: true, data: newQuiz });
  } catch (error) {
    next(error);
  }
};

// 2. Submit Answer (Active Recall)
export const submitQuizAnswer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId, answers } = req.body;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) throw new Error("Quiz not found");

    let score = 0;

    // Loop to check and update
    for (const question of quiz.questions) {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) score++;

      await prisma.question.update({
        where: { id: question.id },
        data: { userAnswer, isCorrect },
      });
    }

    // Update quiz score
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { score },
      include: { questions: true },
    });

    res.json({ success: true, score, total: quiz.total, data: updatedQuiz });
  } catch (error) {
    next(error);
  }
};

// 3. Chat about Quiz Mistakes (New Feature!) 🧠
export const chatAboutQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId, question } = req.body; // User says: "Why was my 3rd question wrong?"

    // Get all quiz details (with correct/wrong answers)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) throw new Error("Quiz not found");

    // Create context for AI
    const quizContext = quiz.questions
      .map(
        (q, idx) => `
      Q${idx + 1}: ${q.questionText}
      My Answer: ${q.userAnswer}
      Correct Answer: ${q.correctAnswer}
      Result: ${q.isCorrect ? "Correct" : "Wrong"}
    `
      )
      .join("\n");

    const prompt = `
      You are a tutor. The user has just taken a quiz. 
      Here is the quiz context and results:
      ${quizContext}

      User Question: ${question}
      
      Answer the user kindly and explain their mistakes if any.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GPT_MODEL,
    });

    res.json({ success: true, answer: completion.choices[0].message.content });
  } catch (error) {
    next(error);
  }
};
