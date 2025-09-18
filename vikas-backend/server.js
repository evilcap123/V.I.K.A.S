import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
=======
// 📂 Setup __dirname (since ES modules don’t have it by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

>>>>>>> 2aa958a (My loacl changes)
// 🔑 Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/* ================================
   ✅ Route 1: POST (Simple JSON)
   ================================ */
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const result = await model.generateContent(message);
    const reply = result.response.text();
    res.json({ reply });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "⚠️ Could not reach Gemini API" });
  }
});

/* ================================
   ✅ Route 2: GET (SSE Streaming)
   ================================ */
app.get("/chat-stream", async (req, res) => {
  const userMessage = req.query.message;
  if (!userMessage) {
    res.write(`data: ${JSON.stringify({ text: "⚠️ Message is required" })}\n\n`);
    return res.end();
  }

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

/* ================================
<<<<<<< HEAD
   ✅ Default Route
   ================================ */
app.get("/", (req, res) => {
  res.send("🚀 Gemini API Server is running! Use POST /chat or GET /chat-stream?message=Hello");
=======
   ✅ Static Frontend
   ================================ */
// Serve all files in /public (HTML, CSS, JS, images…)
app.use(express.static(path.join(__dirname, "public")));

// Default route → load dashboard.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
>>>>>>> 2aa958a (My loacl changes)
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
