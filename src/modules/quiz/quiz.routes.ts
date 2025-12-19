import express from "express";
import auth from "../../middlewares/auth";
import {
  chatAboutQuiz,
  generateQuiz,
  submitQuizAnswer,
} from "./quiz.controller";

const router = express.Router();

router.post("/generate", auth(), generateQuiz);
router.post("/submit", auth(), submitQuizAnswer);
router.post("/chat", auth(), chatAboutQuiz);

export const QuizRoutes = router;
