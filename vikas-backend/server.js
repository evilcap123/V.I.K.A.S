import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

// 📂 Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔗 MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err));

// 🧑 Student Schema
const studentSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
  class: String,
  registrationDate: { type: Date, default: Date.now },
  rp: { type: Number, default: 0 },
  tier: { type: String, default: "Bronze" },
  completedQuizzes: { type: [String], default: [] },
  watchedVideos: { type: [String], default: [] },
  pfp: { type: String, default: null }, // 🖼️ profile picture
});

const Student = mongoose.model("Student", studentSchema);

/* ================================
   ✅ Register
   ================================ */
app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, class: studentClass } = req.body;

    // check if username OR email already exists
    const existingUser = await Student.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.json({ success: false, message: "⚠️ Username or Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new Student({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      class: studentClass,
    });

    await newStudent.save();
    res.json({ success: true, message: "✅ Registration successful" });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ success: false, message: "⚠️ Duplicate username/email" });
    }
    console.error(err);
    res.status(500).json({ success: false, message: "❌ Server error" });
  }
});

/* ================================
   ✅ Login (returns JWT)
   ================================ */
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const student = await Student.findOne({ username });
    if (!student) return res.json({ success: false, message: "⚠️ User not found" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.json({ success: false, message: "❌ Invalid password" });

    const token = jwt.sign(
      { id: student._id, username: student.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        firstName: student.firstName,
        lastName: student.lastName,
        username: student.username,
        email: student.email,
        class: student.class,
        rp: student.rp,
        tier: student.tier,
        pfp: student.pfp,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "❌ Server error" });
  }
});

/* ================================
   ✅ Chat-Gemini Stream
   ================================ */
app.get("/chat-gemini-stream", async (req, res) => {
  const userMessage = req.query.message;
  if (!userMessage) return res.status(400).send("Message required");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");

  try {
    const stream = await ai.models.stream({
      model: "gemini-1.5-flash",
      contents: userMessage,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    res.write(`data: ${JSON.stringify({ text: "⚠️ Could not connect to AI server." })}\n\n`);
    res.end();
  }
});

// 📦 Serve static frontend (for SPA apps)
// 📦 Serve static frontend (for SPA apps)
app.use(express.static(path.join(__dirname, "../public")));

app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});





// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
