import express from "express";
import { UserRoutes } from "../modules/users/user.route";
import { NoteRoutes } from "../modules/notes/note.route";
import { QuizRoutes } from "../modules/quiz/quiz.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/notes",
    route: NoteRoutes,
  },
  {
    path: "/quiz",
    route: QuizRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
