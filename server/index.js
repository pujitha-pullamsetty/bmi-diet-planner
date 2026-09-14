require("dotenv").config();

const express = require("express");
const cors = require("cors");

const foodRoutes = require("./routes/foods");
const bmiRoutes = require("./routes/bmi");
const recommendationRoutes = require("./routes/recommendations");
const aiRoutes = require("./routes/ai");
const userRoutes = require("./routes/users");
const dietDataRoutes = require("./routes/dietData");
const planRoutes = require("./routes/plans");
const authRoutes = require("./routes/auth");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Nutrition AI API is running!",
  });
});

app.use("/api/foods", foodRoutes);
app.use("/api/bmi", bmiRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/diet-data", dietDataRoutes);
app.use("/api/plans", planRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});