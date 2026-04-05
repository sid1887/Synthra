/**
 * C3: AI Orchestration Enhancements
 * Selective AI tasks, explanation adaptation, and confidence-driven workflows
 */

import { ComponentDetection, CircuitIdentification } from '../types/schemas.js';

/**
 * AI query types for selective orchestration
 */
export type AITaskType =
  | 'component_confidence_boost'
  | 'circuit_label_validation'
  | 'design_intent_detection'
  | 'safety_analysis'
  | 'enhancement_suggestions'
  | 'explanation_adaptation'
  | 'error_diagnosis';

/**
 * Adaptive explanation based on user expertise level
 */
export interface AdaptiveExplanation {
  requestId: string;
  level: 'beginner' | 'student' | 'engineer' | 'expert';
  explanation: string;
  keyPoints: string[];
  technicalTerms: { term: string; definition: string }[];
  relatedConcepts: string[];
  confidenceLevel: number;
  source: 'rule-based' | 'ai-generated' | 'hybrid';
}

/**
 * Selective AI task execution plan
 */
export interface AITaskPlan {
  requestId: string;
  tasks: {
    taskType: AITaskType;
    priority: 'critical' | 'high' | 'medium' | 'low';
    rationale: string;
    componentIds?: string[];
    expectedBenefit: number; // 0-1
    timeoutMs: number;
  }[];
  estimatedTokens: number;
  estimatedCostUSD: number;
  totalTimeMs: number;
}

/**
 * Confidence-driven decision for AI invocation
 */
export interface ConfidenceTrigger {
  component?: {
    componentId: string;
    detectionConfidence: number;
    threshold: number;
    needsBoost: boolean;
  };
  circuit?: {
    labelConfidence: number;
    threshold: number;
    needsValidation: boolean;
  };
  overall?: {
    analysisQuality: number;
    requiresEnhancement: boolean;
  };
}

/**
 * Result from selective AI task execution
 */
export interface AITaskResult {
  taskType: AITaskType;
  success: boolean;
  result: any;
  tokensUsed: number;
  latencyMs: number;
  confidence: number;
  error?: string;
}

/**
 * Determine if component needs AI confidence boost
 */
export function shouldBoostComponentConfidence(
  component: ComponentDetection,
  globalThreshold: number = 0.65,
): boolean {
  if (component.confidence > globalThreshold) return false;

  // Critical components always worth boosting
  const criticalLabels = ['battery', 'ground', 'led'];
  if (criticalLabels.includes(component.canonicalLabel)) return true;

  // Components in safety-critical roles
  if (['resistor', 'diode', 'capacitor'].includes(component.canonicalLabel)) {
    return component.confidence < 0.5; // stricter threshold
  }

  return component.confidence < 0.55;
}

/**
 * Determine if circuit label needs AI validation
 */
export function shouldValidateCircuitLabel(
  circuit: CircuitIdentification,
  componentCount: number,
  globalThreshold: number = 0.70,
): boolean {
  if (circuit.confidence > globalThreshold) return false;

  // Validate if topology is complex
  if (circuit.complexity === 'complex') return true;

  // Validate if components have many unknowns
  return circuit.confidence < 0.6;
}

/**
 * Build confidence-driven AI task plan
 */
export function buildAITaskPlan(
  requestId: string,
  components: ComponentDetection[],
  circuit: CircuitIdentification,
  analysisQuality: number = 0.8,
): AITaskPlan {
  const tasks: AITaskPlan['tasks'] = [];

  // Task 1: Boost low-confidence components
  const lowConfidenceComps = components.filter((c) => shouldBoostComponentConfidence(c));

  if (lowConfidenceComps.length > 0) {
    tasks.push({
      taskType: 'component_confidence_boost',
      priority: lowConfidenceComps.some((c) => c.canonicalLabel === 'battery') ? 'critical' : 'high',
      rationale: `${lowConfidenceComps.length} components below confidence threshold`,
      componentIds: lowConfidenceComps.map((c) => c.id),
      expectedBenefit: 0.15,
      timeoutMs: 5000,
    });
  }

  // Task 2: Validate circuit label if needed
  if (shouldValidateCircuitLabel(circuit, components.length)) {
    tasks.push({
      taskType: 'circuit_label_validation',
      priority: 'high',
      rationale: `Circuit confidence ${circuit.confidence.toFixed(2)} below threshold`,
      expectedBenefit: 0.2,
      timeoutMs: 3000,
    });
  }

  // Task 3: Detect design intent if not obvious
  if (circuit.confidence < 0.75 && components.length >= 3) {
    tasks.push({
      taskType: 'design_intent_detection',
      priority: 'medium',
      rationale: 'Uncertain of circuit purpose - analysis could benefit from intent detection',
      expectedBenefit: 0.1,
      timeoutMs: 4000,
    });
  }

  // Task 4: Safety analysis if power-hungry or complex
  const totalPower = components.reduce((sum, c) => {
    if (c.canonicalLabel === 'battery') return sum + 5; // dummy values
    if (c.canonicalLabel === 'resistor') return sum + 0.5;
    return sum + 1;
  }, 0);

  if (totalPower > 10 || circuit.complexity !== 'simple') {
    tasks.push({
      taskType: 'safety_analysis',
      priority: 'high',
      rationale: 'Circuit complexity or power level warrants safety review',
      expectedBenefit: 0.12,
      timeoutMs: 4000,
    });
  }

  // Task 5: Enhancement suggestions if all previous tasks pass
  if (analysisQuality > 0.85 && tasks.length === 0) {
    tasks.push({
      taskType: 'enhancement_suggestions',
      priority: 'low',
      rationale: 'High-confidence analysis - opportunistic enhancement discovery',
      expectedBenefit: 0.08,
      timeoutMs: 3000,
    });
  }

  // Estimate token usage and cost
  const tokensPerTask: Record<AITaskType, number> = {
    component_confidence_boost: 300,
    circuit_label_validation: 250,
    design_intent_detection: 400,
    safety_analysis: 350,
    enhancement_suggestions: 300,
    explanation_adaptation: 200,
    error_diagnosis: 250,
  };

  const estimatedTokens = tasks.reduce((sum, t) => sum + (tokensPerTask[t.taskType] || 0), 0);
  const costPerMillionTokens = 0.1; // USD
  const estimatedCostUSD = (estimatedTokens / 1_000_000) * costPerMillionTokens;
  const totalTimeMs = tasks.reduce((sum, t) => sum + t.timeoutMs, 0);

  return {
    requestId,
    tasks,
    estimatedTokens,
    estimatedCostUSD,
    totalTimeMs,
  };
}

/**
 * Generate adaptive explanation based on expertise level
 */
export function generateAdaptiveExplanation(
  requestId: string,
  circuit: CircuitIdentification,
  components: ComponentDetection[],
  baseExplanation: string,
  level: 'beginner' | 'student' | 'engineer' | 'expert' = 'student',
): AdaptiveExplanation {
  const explanations: Record<string, string> = {
    beginner:
      'This circuit powers a light when switched on. Current flows from the battery through the resistor (to limit brightness) and LED, back to the battery.',
    student:
      'Series circuit with current-limiting resistor for LED operation. Total voltage drop across resistor and LED equals battery voltage.',
    engineer:
      'DC series circuit. Resistor provides current limiting (If=V_bat/R). LED operates in forward bias region with V_f ≈ 2V.',
    expert:
      'Resistor value designed for If = (V_bat - V_f_led) / R ≈ 20mA. Power dissipation in resistor: P_r = If² * R. Consider thermal derating and tolerance stack-up.',
  };

  const keyPointsByLevel: Record<string, string[]> = {
    beginner: ['Power flows from battery', 'Resistor limits current', 'LED lights up when on'],
    student: ['Series circuit topology', 'Ohm\'s law applies', 'Voltage divides between components'],
    engineer: [
      'Total circuit resistance = R_resistor + R_led_forward',
      'Operating point: If = (V_bat - V_led_f) / R',
      'Power budget and thermal considerations',
    ],
    expert: [
      'Temperature coefficient of R and V_f affects circuit stability',
      'Transient response dominated by parasitic inductance',
      'EMI from switching edges should be managed',
    ],
  };

  const technicalTerms: AdaptiveExplanation['technicalTerms'] = [];

  if (level !== 'beginner') {
    technicalTerms.push(
      { term: 'Forward voltage (V_f)', definition: 'Minimum voltage drop across LED in conduction' },
      { term: 'Current limiting', definition: 'Resistor reduces current to safe LED operating range' },
    );
  }

  if (level === 'engineer' || level === 'expert') {
    technicalTerms.push(
      {
        term: 'Power dissipation',
        definition: 'Heat generated: P = I² * R = V * I',
      },
      {
        term: 'Thermal derating',
        definition: 'Component performance changes with temperature',
      },
    );
  }

  const relatedConcepts = [];
  if (level !== 'beginner') {
    relatedConcepts.push('Series vs parallel circuits');
    relatedConcepts.push('Kirchhoff\'s voltage law (KVL)');
  }
  if (level === 'engineer' || level === 'expert') {
    relatedConcepts.push('Transient response');
    relatedConcepts.push('Frequency response');
    relatedConcepts.push('Stability analysis');
  }

  return {
    requestId,
    level,
    explanation: explanations[level] || baseExplanation,
    keyPoints: keyPointsByLevel[level] || [],
    technicalTerms,
    relatedConcepts,
    confidenceLevel: circuit.confidence,
    source: 'rule-based',
  };
}

/**
 * Mock AI task executor - simulates AI API calls without actual calls
 */
export async function executeAITask(task: AITaskPlan['tasks'][0]): Promise<AITaskResult> {
  const startTime = Date.now();

  // Simulate API call latency
  await new Promise((resolve) => setTimeout(resolve, Math.random() * task.timeoutMs * 0.5));

  const latencyMs = Date.now() - startTime;

  switch (task.taskType) {
    case 'component_confidence_boost':
      return {
        taskType: task.taskType,
        success: true,
        result: {
          boostedComponents: (task.componentIds || []).length,
          confidenceIncrease: 0.1,
          validatedLabels: (task.componentIds || []).length,
        },
        tokensUsed: 250,
        latencyMs,
        confidence: 0.92,
      };

    case 'circuit_label_validation':
      return {
        taskType: task.taskType,
        success: true,
        result: {
          validatedLabel: 'battery_resistor_led',
          alternativeLabels: ['series_resistive_load'],
          confidence: 0.88,
          topologyValid: true,
        },
        tokensUsed: 200,
        latencyMs,
        confidence: 0.85,
      };

    case 'design_intent_detection':
      return {
        taskType: task.taskType,
        success: true,
        result: {
          intent: 'illumination_controller',
          purposeConfidence: 0.9,
          likelyApplications: ['indicator_light', 'flashlight', 'status_display'],
        },
        tokensUsed: 350,
        latencyMs,
        confidence: 0.82,
      };

    case 'safety_analysis':
      return {
        taskType: task.taskType,
        success: true,
        result: {
          safetyLevel: 'low_risk',
          concerns: [],
          recommendations: ['Standard operating conditions', 'No special handling required'],
        },
        tokensUsed: 300,
        latencyMs,
        confidence: 0.88,
      };

    case 'enhancement_suggestions':
      return {
        taskType: task.taskType,
        success: true,
        result: {
          suggestions: [
            'Add capacitor across LED for noise immunity',
            'Consider zener diode for reverse polarity protection',
          ],
          improvementPotential: 0.3,
        },
        tokensUsed: 280,
        latencyMs,
        confidence: 0.75,
      };

    case 'explanation_adaptation':
      return {
        taskType: task.taskType,
        success: true,
        result: {
          adaptedExplanations: {
            beginner: 'Simple power circuit...',
            student: 'Series DC circuit with current limiting...',
            engineer: 'Current limiting with LED forward voltage compensation...',
          },
        },
        tokensUsed: 180,
        latencyMs,
        confidence: 0.9,
      };

    case 'error_diagnosis':
      return {
        taskType: task.taskType,
        success: true,
        result: {
          diagnosedIssues: [],
          healthStatus: 'nominal',
        },
        tokensUsed: 220,
        latencyMs,
        confidence: 0.85,
      };

    default:
      return {
        taskType: task.taskType,
        success: false,
        result: null,
        tokensUsed: 0,
        latencyMs,
        confidence: 0,
        error: 'Unknown task type',
      };
  }
}

/**
 * Execute full AI task plan with orchestration decisions
 */
export async function executeAITaskPlan(plan: AITaskPlan): Promise<AITaskResult[]> {
  const results: AITaskResult[] = [];

  // Execute tasks in priority order
  const sortedTasks = [...plan.tasks].sort((a, b) => {
    const priorityScore = { critical: 3, high: 2, medium: 1, low: 0 };
    return priorityScore[b.priority] - priorityScore[a.priority];
  });

  for (const task of sortedTasks) {
    try {
      const result = await executeAITask(task);
      results.push(result);

      // Stop if critical task fails
      if (task.priority === 'critical' && !result.success) {
        break;
      }
    } catch (error) {
      results.push({
        taskType: task.taskType,
        success: false,
        result: null,
        tokensUsed: 0,
        latencyMs: 0,
        confidence: 0,
        error: String(error),
      });
    }
  }

  return results;
}

/**
 * Generate confidence trigger report
 */
export function analyzeConfidenceTriggers(
  components: ComponentDetection[],
  circuit: CircuitIdentification,
  analysisQuality: number = 0.8,
): ConfidenceTrigger {
  // Find lowest confidence component
  const lowestConfComp = components.reduce((lowest, curr) =>
    curr.confidence < lowest.confidence ? curr : lowest,
  );

  const trigger: ConfidenceTrigger = {
    component:
      lowestConfComp.confidence < 0.65
        ? {
            componentId: lowestConfComp.id,
            detectionConfidence: lowestConfComp.confidence,
            threshold: 0.65,
            needsBoost: true,
          }
        : undefined,
    circuit:
      circuit.confidence < 0.70
        ? {
            labelConfidence: circuit.confidence,
            threshold: 0.70,
            needsValidation: true,
          }
        : undefined,
    overall:
      analysisQuality < 0.75
        ? {
            analysisQuality,
            requiresEnhancement: true,
          }
        : undefined,
  };

  return trigger;
}

/**
 * Format AI task plan for display/logging
 */
export function formatTaskPlan(plan: AITaskPlan): string {
  const taskSummary = plan.tasks
    .map((t) => `${t.priority.toUpperCase()}: ${t.taskType} (${t.timeoutMs}ms)`)
    .join('\n');

  return `
AI Task Orchestration Plan
==========================
Request ID: ${plan.requestId}
Total Tasks: ${plan.tasks.length}
Estimated Tokens: ${plan.estimatedTokens}
Estimated Cost: $${plan.estimatedCostUSD.toFixed(4)}
Total Time: ${plan.totalTimeMs}ms

Tasks:
${taskSummary}
  `.trim();
}
