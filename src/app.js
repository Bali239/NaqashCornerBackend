import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: false, allowedHeaders: ["Content-Type", "Authorization"] }));
app.use("/api/auth", authRouter);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

export default app;
