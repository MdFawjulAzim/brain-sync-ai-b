// check_ai.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function checkModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Get the model list
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy initialization

    console.log("Checking available models for your API Key...");

    // This will do the real work, print all model names
    /* Note: The function to list directly may vary in the SDK, 
       so we are using a trick or direct test. 
       But in the latest version of the SDK, there is no way to list models, 
       so we will test the standard names.
    */

    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
      "gemini-pro",
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`✅ SUCCESS: '${modelName}' is working! Use this name.`);
        return; // Stop the loop as soon as one works
      } catch (error) {
        console.log(
          `❌ FAILED: '${modelName}' - ${error.message.split("[")[0]}`
        );
      }
    }
  } catch (error) {
    console.error("Critical Error:", error);
  }
}

checkModels();
