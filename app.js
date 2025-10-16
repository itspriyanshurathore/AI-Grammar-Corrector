import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index", {
    corrected: "",
    originalText: "",
  });
});

app.post("/correct", async (req, res) => {
  const text = req.body.text?.trim();

  if (!text) {
    return res.render("index", {
      corrected: "Please enter some text to correct.",
      alternateCorrectText: [],
      originalText: "",
    });
  }

  try {
    const prompt = `
    Correct the grammar and spelling of the following text clearly and naturally.
    Return only a JSON object in this structure:
    {
      "correctedText": "string",
      "alternateCorrectText": ["string", "string", "string"]
    }
    Do NOT include any markdown formatting like \`\`\`json.
    Text: ${text}
    `;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("🔹 Raw AI Response:", response.text);

    // ✅ Strip markdown backticks if present
    let cleanedText = response.text.replace(/```json|```/g, "").trim();

    let correctedText = "";
    let alternateCorrectText = [];

    try {
      const data = JSON.parse(cleanedText);
      correctedText = data.correctedText || "";
      alternateCorrectText = data.alternateCorrectText || [];
    } catch (parseError) {
      console.error("⚠️ JSON Parse Error:", parseError);
      correctedText = "Could not parse AI response. Please try again.";
    }

    res.render("index", {
      corrected: correctedText,
      alternateCorrectText,
      originalText: text,
    });

  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    res.render("index", {
      corrected: "Error using Gemini API. Please try again later.",
      alternateCorrectText: [],
      originalText: text,
    });
  }
});

// Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
