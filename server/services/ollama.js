const axios = require("axios");

async function askGemma(prompt) {
  try {
    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "gemma2:2b",
        prompt: prompt,
        stream: false,
      }
    );

    return response.data.response;
  } catch (error) {
    console.error("Ollama error:", error.message);
    throw new Error("Failed to communicate with Ollama");
  }
}

module.exports = {
  askGemma,
};