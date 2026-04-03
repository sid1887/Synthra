import { z } from "zod";

export const analyzeRequestBodySchema = z.object({
  minConfidence: z.coerce.number().min(0).max(1).optional()
});

export function parseAnalyzeBody(body) {
  const parsed = analyzeRequestBodySchema.safeParse(body || {});
  if (!parsed.success) {
    return {
      minConfidence: undefined,
      issues: parsed.error.issues.map((issue) => issue.message)
    };
  }

  return {
    minConfidence: parsed.data.minConfidence,
    issues: []
  };
}
