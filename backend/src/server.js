import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { timeoutMiddleware } from "./middleware/timeout.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";
import { analyzeRouter } from "./routes/analyze.js";
import { logInfo } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const frontendDir = path.join(rootDir, "frontend");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(timeoutMiddleware);
app.use(requestIdMiddleware);

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: config.rateLimitPerMin,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use("/api", healthRouter);
app.use("/api", analyzeRouter);

app.use(express.static(frontendDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  logInfo("system", "server_started", {
    port: config.port,
    env: config.env,
    version: config.appVersion
  });
});

function shutdown(signal) {
  logInfo("system", "server_shutdown", { signal });
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
