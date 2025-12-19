import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db";
import { GPT_MODEL, openai } from "../../utils/openai";
import { chatModel } from "../../utils/ai";

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
      if (!note) {
        res.status(404).json({ message: "Note not found" });
        return;
      }
      contentToQuiz = note.content;
    } else {
      const notes = await prisma.note.findMany({
        where: { userId },
        take: 3,
        orderBy: { createdAt: "desc" },
      });
      contentToQuiz = notes.map((n) => n.content).join("\n\n");
    }

    if (!contentToQuiz) {
      res.status(400).json({ message: "No content found to generate quiz." });
      return;
    }

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

    // Ask OpenAI to respond in JSON format, fallback to Gemini
    let quizData;
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: GPT_MODEL,
        response_format: { type: "json_object" },
      });
      quizData = JSON.parse(completion.choices[0].message.content || "{}");
    } catch (error) {
      console.log("OpenAI failed, trying Gemini:", (error as Error).message);
      try {
        // Fallback to Gemini
        const result = await chatModel.generateContent(
          prompt +
            "\n\nIMPORTANT: Respond ONLY with valid JSON. Do not use Markdown code blocks."
        );
        const response = await result.response;
        let text = response.text();

        // 🟢 FIX: Remove Markdown code blocks (```json ... ```) before parsing
        text = text.replace(/```json|```/g, "").trim();

        console.log("Gemini response (Cleaned):", text); // Debug log
        quizData = JSON.parse(text);
      } catch (geminiError) {
        console.log("Gemini also failed:", (geminiError as Error).message);
        throw new Error("Both OpenAI and Gemini failed to generate quiz.");
      }
    }

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

    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

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

    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

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
      You are a friendly AI tutor. The user has just taken a quiz. 
      Here is the quiz context and results:
      ${quizContext}

      User Question: ${question}
      
      Answer the user kindly and explain their mistakes if any. Keep it concise.
    `;

    let answer;
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: GPT_MODEL,
      });
      answer = completion.choices[0].message.content;
    } catch (error) {
      console.log("OpenAI failed, trying Gemini:", (error as Error).message);
      try {
        const result = await chatModel.generateContent(prompt);
        const response = await result.response;
        answer = response.text();
      } catch (geminiError) {
        console.log("Gemini also failed:", (geminiError as Error).message);
        throw new Error(
          "Both OpenAI and Gemini failed to answer the question."
        );
      }
    }

    res.json({ success: true, answer });
  } catch (error) {
    next(error);
  }
};
