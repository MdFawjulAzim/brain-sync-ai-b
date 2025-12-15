import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { NoteControllers } from "./note.controller";
import { NoteValidation } from "./note.validation";

const router = express.Router();

// Route: /api/v1/notes
router.post(
  "/",
  auth(),
  validateRequest(NoteValidation.createNoteZodSchema),
  NoteControllers.createNote
);
router.get(
  "/",
  auth(),
  validateRequest(NoteValidation.getNotesZodSchema),
  NoteControllers.getAllNotes
);

export const NoteRoutes = router;
