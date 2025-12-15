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
};
