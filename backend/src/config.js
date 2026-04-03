import dotenv from "dotenv";

dotenv.config();

function num(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  env: process.env.SYNTHRA_ENV || "development",
  port: num(process.env.PORT, 8787),
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 10),
  requestTimeoutMs: num(process.env.REQUEST_TIMEOUT_MS, 30000),
  rateLimitPerMin: num(process.env.RATE_LIMIT_PER_MIN, 30),
  minConfidenceDefault: Number(process.env.MIN_CONFIDENCE_DEFAULT || 0.65),
  appVersion: process.env.APP_VERSION || "1.0.0",
  logLevel: process.env.LOG_LEVEL || "info",
  
  // Hugging Face API
  hfToken: process.env.HF_API_TOKEN || "",
  hfModelId: process.env.HF_MODEL_ID || "google/owlvit-base-patch32",
  hfApiUrl: process.env.HF_API_URL || "https://api-inference.huggingface.co/models"
};
