import express from "express";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.post("/api/smartbuddy", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const r = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gemma2:2b", prompt, stream: false }),
    });

    if (!r.ok) return res.status(500).json({ error: "ollama error" });

    const data = await r.json();
    res.json({ text: data.response || "" });
  } catch (e) {
    res.status(500).json({ error: e?.message || "server error" });
  }
});

app.listen(5175, () => console.log("API: http://localhost:5175"));
