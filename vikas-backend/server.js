import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ✅ Streaming endpoint (SSE)
app.get("/chat", async (req, res) => {
  const userMessage = req.query.message;

  try {
    const streamingResp = await model.generateContentStream(userMessage);

    // Setup Server-Sent Events (SSE) headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of streamingResp.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.end();
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.write(`data: ${JSON.stringify({ text: "⚠️ Error: Could not reach Gemini API." })}\n\n`);
    res.end();
  }
});

app.listen(5000, () =>
  console.log("✅ Gemini streaming server running at http://localhost:5000")
);
