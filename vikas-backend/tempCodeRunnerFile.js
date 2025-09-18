import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());           // ✅ enable CORS once
app.use(express.json());

app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful study assistant." },
                    { role: "user", content: userMessage }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("OpenAI API Error:", data.error);
            return res.status(500).json({ reply: "⚠️ OpenAI API error: " + data.error.message });
        }

        res.json({ reply: data.choices[0].message.content });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ reply: "⚠️ Error: Could not reach OpenAI." });
    }
});

// ✅ Run backend on port 5000
app.listen(5000, () => console.log("✅ Server running at http://localhost:5000"));
