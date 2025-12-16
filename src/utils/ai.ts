import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY as string);

export const getEmbedding = async (text: string) => {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

export const chatModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});
