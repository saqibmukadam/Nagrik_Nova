import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import issueRoutes from "./routes/issues.js";
import historicalRoutes from "./routes/historical.js";
import challengeRoutes from "./routes/challenge.js";
import aiRoutes from "./routes/ai_chatbot.js";
import userRoutes from "./routes/userSettings.js";
const app = express();
console.log(
  "Groq key loaded:",
  process.env.GROQ_API_KEY ? "YES" : "NO"
);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.get("/api/health", (_, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/historical", historicalRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Nagrik Nova API ready on port ${PORT}`);
  });
}

export default app;