require("dotenv").config();

async function getAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ API Key not found in .env");
    return;
  }

  console.log("🔍 Asking Google for available models...");

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ Error from Google:", data.error.message);
      return;
    }

    if (!data.models) {
      console.log("⚠️ No models found.");
      return;
    }

    console.log("\n✅ AVAILABLE MODELS FOR YOU:");
    console.log("-----------------------------");
    
    // Filter only those that support 'generateContent'
    const contentModels = data.models.filter(m => 
      m.supportedGenerationMethods.includes("generateContent")
    );

    contentModels.forEach((model) => {
      // models/gemini-pro -> gemini-pro
      console.log(`🌟 ${model.name.replace("models/", "")}`);
    });
    console.log("-----------------------------");
    console.log("👉 Pick one name from above and use it in your controller.");

  } catch (error) {
    console.error("❌ Network Error:", error.message);
  }
}

getAvailableModels();