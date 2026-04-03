import { Router } from "express";
import { config } from "../config.js";

export const healthRouter = Router();

healthRouter.get("/health", (req, res) => {
  res.json({
    requestId: req.requestId,
    status: "ok",
    env: config.env,
    version: config.appVersion,
    now: new Date().toISOString()
  });
});

healthRouter.get("/version", (req, res) => {
  res.json({
    requestId: req.requestId,
    version: config.appVersion
  });
});

healthRouter.get("/health/modules", (req, res) => {
  res.json({
    requestId: req.requestId,
    status: "ok",
    modules: {
      imageInput: "up",
      backendApi: "up",
      componentPipeline: "up",
      circuitEngine: "up",
      explanationEngine: "up",
      diagnosticsEngine: "up",
      simulation: "disabled",
      visualization3d: "disabled",
      automation: "disabled"
    }
  });
});
