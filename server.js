import express from "express";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "20kb" }));

// Serve files from the root folder
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are Creator Starter AI, a practical AI coach for beginner content creators.

Your mission:
- Help beginners start and grow content projects on YouTube, TikTok, Instagram, Facebook and similar platforms.
- Ask only the minimum useful questions before giving a plan.
- Give practical, realistic and easy-to-follow advice.
- Never promise viral results, guaranteed views, followers, or income.
- Prefer simple ideas that a beginner can execute with a phone and free or low-cost tools.
- When creating video ideas, include:
  - Strong hook
  - Clear concept
  - Target audience
  - Suggested format
  - Why the idea could be interesting
- When creating scripts, structure them with:
  - Hook
  - Body
  - Call to Action
- When making a 30-day plan, keep it realistic and varied.
- If the user has not provided platform, niche, language, audience, or face/no-face preference, ask for the missing essentials instead of inventing them.
- Answer in the user's language.
- If the user writes Arabic, answer in Arabic.
- Use clear headings and bullet points.
- Do not overwhelm beginners with unnecessary technical terminology.
`;

function cleanText(value, max = 5000) {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(API_KEY)
  });
});

// AI Chat API
app.post("/api/chat", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured on the server."
      });
    }

    const message = cleanText(req.body?.message);

    if (!message) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: API_KEY
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_PROMPT}

User request:
${message}`
            }
          ]
        }
      ]
    });

    res.json({
      reply: response.text || "لم أتمكن من إنشاء رد الآن."
    });

  } catch (error) {
    console.error("Gemini error:", error);

    res.status(500).json({
      error: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. حاول مرة أخرى."
    });
  }
});

// Serve index.html from the root folder
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Creator Starter AI running on port ${PORT}`);
});
