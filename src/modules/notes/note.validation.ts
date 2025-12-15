import { z } from "zod";

export const NoteValidation = {
  createNoteZodSchema: z.object({
    body: z.object({
      title: z.string().min(1, "Title is required"),
      content: z.string().min(1, "Content is required"),
      isPinned: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),
  getNotesZodSchema: z.object({
    query: z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
    }),
  }),
};
