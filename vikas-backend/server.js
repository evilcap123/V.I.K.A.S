import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 📂 Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔗 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
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
  watchedVideos: { type: [String], default: [] }
});

const Student = mongoose.model("Student", studentSchema);

/* ================================
   ✅ Register
   ================================ */
app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, class: studentClass } = req.body;

    // check if user exists
    const existingUser = await Student.findOne({ username });
    if (existingUser) {
      return res.json({ success: false, message: "⚠️ Username already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new Student({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      class: studentClass
    });

    await newStudent.save();
    res.json({ success: true, message: "✅ Registration successful" });

  } catch (err) {
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
    if (!student) {
      return res.json({ success: false, message: "⚠️ User not found" });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.json({ success: false, message: "❌ Invalid password" });
    }

    // create JWT
    const token = jwt.sign(
      { id: student._id, username: student.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token,
      user: {
        username: student.username,
        email: student.email,
        class: student.class,
        rp: student.rp,
        tier: student.tier,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "❌ Server error" });
  }
});

/* ================================
   ✅ Protected Example
   ================================ */
app.get("/dashboard-data", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "⚠️ No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, message: `Welcome, ${decoded.username}!` });
  } catch (err) {
    res.status(401).json({ success: false, message: "⚠️ Invalid/Expired token" });
  }
});

/* ================================
   ✅ Static Frontend
   ================================ */
app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
