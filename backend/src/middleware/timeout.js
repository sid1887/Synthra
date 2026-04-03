import { config } from "../config.js";

export function timeoutMiddleware(req, res, next) {
  req.setTimeout(config.requestTimeoutMs);
  res.setTimeout(config.requestTimeoutMs);
  next();
}
