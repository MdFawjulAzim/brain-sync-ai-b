const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY is missing in .env file");
    return;
  }

  console.log("🔑 Testing with API Key:", apiKey.substring(0, 10) + "...");

  const genAI = new GoogleGenerativeAI(apiKey);

  const modelName = "gemini-1.5-flash";

  try {
    console.log(`⏳ Connecting to Google AI (${modelName})...`);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent("Just say 'AI Online'");
    const response = await result.response;
    const text = response.text();

    console.log("\n✅ SUCCESS! AI is working perfectly.");
    console.log("🤖 Response:", text);
    console.log("👉 Use this model in your controller:", modelName);
  } catch (error) {
    console.log("\n❌ FAILED to connect.");
    console.log("------------------------------------------------");
    console.log("Error Details:", error.message);
    console.log("------------------------------------------------");
    console.log(
      "Suggestion: Create a NEW API Key from https://aistudio.google.com/app/apikey"
    );
  }
}

checkModels();
