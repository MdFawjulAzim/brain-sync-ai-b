require("dotenv").config();

async function getOpenAIModels() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("❌ OpenAI API Key not found");
    return;
  }

  const url = "https://api.openai.com/v1/models";

  try {
    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    const data = await response.json();

    console.log("✅ AVAILABLE CHATGPT MODELS:");
    data.data.forEach(model => console.log(`🌟 ${model.id}`));
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

getOpenAIModels();
