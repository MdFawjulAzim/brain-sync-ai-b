import express from "express";
import { UserRoutes } from "../modules/users/user.route";
import { NoteRoutes } from "../modules/notes/note.route";

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
