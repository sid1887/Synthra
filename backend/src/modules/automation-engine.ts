/**
 * C4: Automation Engine
 * Event-trigger rules, preview, dry-run, and action logging
 */

import { CircuitIdentification, ComponentDetection } from '../types/schemas.js';

/**
 * Automation trigger condition
 */
export type TriggerCondition =
  | 'low_confidence'
  | 'missing_component'
  | 'safety_violation'
  | 'polarity_error'
  | 'open_circuit'
  | 'short_circuit'
  | 'power_exceeded'
  | 'temperature_warning'
  | 'unknown_circuit'
  | 'complex_circuit';

/**
 * Automation action to execute
 */
export type AutomationAction =
  | 'request_clarification'
  | 'flag_for_review'
  | 'retry_analysis'
  | 'boost_ai_confidence'
  | 'suggest_fix'
  | 'trigger_alert'
  | 'auto_export'
  | 'auto_simulate'
  | 'auto_compare'
  | 'notify_user';

/**
 * Automation rule definition
 */
export interface AutomationRule {
  ruleId: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: {
    condition: TriggerCondition;
    threshold?: number;
    componentTypes?: string[];
  }[];
  actions: {
    action: AutomationAction;
    parameters?: Record<string, any>;
    delayMs?: number;
  }[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  maxExecutionsPerDay: number;
  createdAt: string;
  lastModified: string;
}

/**
 * Automation execution log entry
 */
export interface AutomationLog {
  logId: string;
  requestId: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: string;
  triggers: string[];
  executedActions: {
    action: AutomationAction;
    status: 'success' | 'failed' | 'skipped';
    result?: any;
    error?: string;
    executedAt: string;
    durationMs: number;
  }[];
  overallStatus: 'success' | 'partial_success' | 'failed';
  totalDurationMs: number;
}

/**
 * Dry-run preview of automation
 */
export interface AutomationPreview {
  ruleId: string;
  ruleName: string;
  wouldTrigger: boolean;
  matchedTriggers: string[];
  plannedActions: {
    action: AutomationAction;
    description: string;
    estimatedImpact: string;
  }[];
  riskLevel: 'safe' | 'cautious' | 'risky';
  recommendations: string[];
}

/**
 * Automation execution statistics
 */
export interface AutomationStats {
  totalRulesEnabled: number;
  rulesExecutedToday: number;
  totalActionsExecuted: number;
  successRate: number;
  averageDurationMs: number;
  mostTriggeredRule: string | null;
  recentLogs: AutomationLog[];
}

/**
 * Built-in automation rules
 */
export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    ruleId: 'rule_low_confidence_auto_boost',
    name: 'Auto-Boost Low Confidence',
    description: 'Automatically invoke AI to boost component confidence when below 0.6',
    enabled: true,
    triggers: [{ condition: 'low_confidence', threshold: 0.6 }],
    actions: [
      { action: 'boost_ai_confidence', delayMs: 0 },
      { action: 'retry_analysis', delayMs: 500 },
    ],
    priority: 'high',
    maxExecutionsPerDay: 100,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },

  {
    ruleId: 'rule_safety_violation_alert',
    name: 'Safety Violation Alert',
    description: 'Alert user when polarity or short circuit risks detected',
    enabled: true,
    triggers: [
      { condition: 'polarity_error' },
      { condition: 'short_circuit' },
      { condition: 'power_exceeded', threshold: 500 },
    ],
    actions: [
      { action: 'trigger_alert', parameters: { level: 'critical' } },
      { action: 'flag_for_review', delayMs: 100 },
      { action: 'notify_user', parameters: { channel: 'ui_toast' } },
    ],
    priority: 'critical',
    maxExecutionsPerDay: 500,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },

  {
    ruleId: 'rule_unknown_circuit_investigation',
    name: 'Investigate Unknown Circuits',
    description: 'When circuit type cannot be determined, trigger detailed AI analysis',
    enabled: true,
    triggers: [{ condition: 'unknown_circuit' }],
    actions: [
      { action: 'boost_ai_confidence', parameters: { force: true }, delayMs: 0 },
      { action: 'request_clarification', parameters: { askSecondImage: true }, delayMs: 500 },
    ],
    priority: 'high',
    maxExecutionsPerDay: 50,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },

  {
    ruleId: 'rule_complex_auto_simulate',
    name: 'Auto-Simulate Complex Circuits',
    description: 'Automatically run simulation for circuit complexity > simple',
    enabled: true,
    triggers: [{ condition: 'complex_circuit' }],
    actions: [
      { action: 'auto_simulate', parameters: { type: 'transient' }, delayMs: 1000 },
      { action: 'auto_compare', parameters: { compareWithBaseCase: true }, delayMs: 2000 },
    ],
    priority: 'medium',
    maxExecutionsPerDay: 100,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },

  {
    ruleId: 'rule_open_circuit_suggest_fix',
    name: 'Suggest Fixes for Open Circuits',
    description: 'When open circuit detected, suggest fixes automatically',
    enabled: true,
    triggers: [{ condition: 'open_circuit' }],
    actions: [
      { action: 'flag_for_review', delayMs: 0 },
      { action: 'suggest_fix', delayMs: 500 },
      { action: 'request_clarification', delayMs: 1000 },
    ],
    priority: 'high',
    maxExecutionsPerDay: 80,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },

  {
    ruleId: 'rule_successful_analysis_export',
    name: 'Auto-Export Successful Analyses',
    description: 'Export analysis result when confidence > 0.85',
    enabled: false, // disabled by default
    triggers: [
      {
        condition: 'low_confidence', // inverse: when NOT low confidence
        threshold: 0.85, // high threshold = successful
      },
    ],
    actions: [
      { action: 'auto_export', parameters: { formats: ['json', 'markdown'] }, delayMs: 1000 },
    ],
    priority: 'low',
    maxExecutionsPerDay: 500,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
];

/**
 * Evaluate if a rule's triggers match current analysis state
 */
export function evaluateRuleTriggers(
  rule: AutomationRule,
  components: ComponentDetection[],
  circuit: CircuitIdentification,
  analysisMetrics: {
    hasPolarityErrors: boolean;
    hasOpenCircuit: boolean;
    hasShortCircuit: boolean;
    totalPower: number;
    lowestConfidence: number;
    unknownComponents: number;
  },
): { triggered: boolean; matchedConditions: TriggerCondition[] } {
  const matchedConditions: TriggerCondition[] = [];

  for (const trigger of rule.triggers) {
    let matches = false;

    switch (trigger.condition) {
      case 'low_confidence':
        // Trigger if lowest confidence below threshold
        matches =
          analysisMetrics.lowestConfidence < (trigger.threshold ?? 0.65);
        break;

      case 'missing_component':
        matches = analysisMetrics.unknownComponents > 0;
        break;

      case 'safety_violation':
        matches = analysisMetrics.hasPolarityErrors || analysisMetrics.totalPower > 500;
        break;

      case 'polarity_error':
        matches = analysisMetrics.hasPolarityErrors;
        break;

      case 'open_circuit':
        matches = analysisMetrics.hasOpenCircuit;
        break;

      case 'short_circuit':
        matches = analysisMetrics.hasShortCircuit;
        break;

      case 'power_exceeded':
        matches = analysisMetrics.totalPower > (trigger.threshold ?? 100);
        break;

      case 'unknown_circuit':
        matches = circuit.confidence < 0.6 || circuit.label === 'unknown';
        break;

      case 'complex_circuit':
        matches = circuit.complexity === 'complex';
        break;

      case 'temperature_warning':
        // Placeholder: detected from thermal analysis
        matches = false;
        break;
    }

    if (matches) {
      matchedConditions.push(trigger.condition);
    }
  }

  return {
    triggered: matchedConditions.length > 0,
    matchedConditions,
  };
}

/**
 * Generate dry-run preview of automation rule
 */
export function previewAutomationRule(
  rule: AutomationRule,
  components: ComponentDetection[],
  circuit: CircuitIdentification,
  analysisMetrics: any,
): AutomationPreview {
  const evaluation = evaluateRuleTriggers(rule, components, circuit, analysisMetrics);

  const plannedActions = rule.actions.map((action) => ({
    action: action.action,
    description: describeAction(action.action, action.parameters),
    estimatedImpact: estimateActionImpact(action.action),
  }));

  let riskLevel: AutomationPreview['riskLevel'] = 'safe';
  if (rule.priority === 'critical') riskLevel = 'risky';
  else if (rule.priority === 'high') riskLevel = 'cautious';

  const recommendations: string[] = [];

  if (!rule.enabled) {
    recommendations.push('⚠️ Rule is currently disabled');
  }

  if (evaluation.matchedConditions.length === 0) {
    recommendations.push('✓ Rule would NOT trigger under current conditions');
  }

  if (riskLevel === 'risky') {
    recommendations.push('⚠️ This rule has critical priority - review carefully before enabling');
  }

  if (plannedActions.length > 3) {
    recommendations.push('ℹ️ Multiple actions planned - may take some time to complete');
  }

  return {
    ruleId: rule.ruleId,
    ruleName: rule.name,
    wouldTrigger: evaluation.triggered,
    matchedTriggers: evaluation.matchedConditions,
    plannedActions,
    riskLevel,
    recommendations,
  };
}

/**
 * Execute automation rule actions
 */
export async function executeAutomationRule(
  rule: AutomationRule,
  requestId: string,
  analysisContext: any,
): Promise<AutomationLog> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  const executedActions: AutomationLog['executedActions'] = [];

  for (const actionDef of rule.actions) {
    const actionStart = Date.now();

    // Add delay if specified
    if (actionDef.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, actionDef.delayMs));
    }

    try {
      const result = await executeAutomationAction(
        actionDef.action,
        actionDef.parameters,
        analysisContext,
      );

      executedActions.push({
        action: actionDef.action,
        status: result.success ? 'success' : 'failed',
        result: result.data,
        error: result.error,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - actionStart,
      });
    } catch (error) {
      executedActions.push({
        action: actionDef.action,
        status: 'failed',
        error: String(error),
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - actionStart,
      });
    }
  }

  const successCount = executedActions.filter((a) => a.status === 'success').length;
  let overallStatus: AutomationLog['overallStatus'] = 'failed';
  if (successCount === executedActions.length) overallStatus = 'success';
  else if (successCount > 0) overallStatus = 'partial_success';

  return {
    logId,
    requestId,
    ruleId: rule.ruleId,
    ruleName: rule.name,
    triggeredAt: new Date().toISOString(),
    triggers: rule.triggers.map((t) => t.condition),
    executedActions,
    overallStatus,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Execute individual automation action (mock implementation)
 */
async function executeAutomationAction(
  action: AutomationAction,
  parameters: Record<string, any> | undefined,
  context: any,
): Promise<{ success: boolean; data?: any; error?: string }> {
  // Simulate action execution
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

  switch (action) {
    case 'request_clarification':
      return { success: true, data: { clarificationRequested: true } };

    case 'flag_for_review':
      return { success: true, data: { flagged: true, reviewer: 'automation' } };

    case 'retry_analysis':
      return { success: true, data: { retryInitiated: true } };

    case 'boost_ai_confidence':
      return { success: true, data: { boostRequested: true } };

    case 'suggest_fix':
      return {
        success: true,
        data: { suggestions: ['Check polarity', 'Verify component values'] },
      };

    case 'trigger_alert':
      return {
        success: true,
        data: { alertTriggered: true, level: parameters?.level || 'warning' },
      };

    case 'auto_export':
      return {
        success: true,
        data: { exportFormats: parameters?.formats || ['json'] },
      };

    case 'auto_simulate':
      return { success: true, data: { simulationStarted: true } };

    case 'auto_compare':
      return { success: true, data: { comparisonInitiated: true } };

    case 'notify_user':
      return {
        success: true,
        data: { notification: 'sent', channel: parameters?.channel || 'ui' },
      };

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

/**
 * Generate human-readable description of action
 */
function describeAction(action: AutomationAction, parameters?: Record<string, any>): string {
  const descriptions: Record<AutomationAction, string> = {
    request_clarification:
      'Request additional image or clarification from user',
    flag_for_review: 'Mark analysis for manual review',
    retry_analysis: 'Retry the analysis pipeline',
    boost_ai_confidence: 'Invoke AI service to improve confidence scores',
    suggest_fix: 'Generate fix suggestions for detected issues',
    trigger_alert: 'Trigger alert notification to user',
    auto_export: `Export to formats: ${parameters?.formats?.join(', ') || 'JSON'}`,
    auto_simulate: 'Run simulation analysis',
    auto_compare: 'Compare with baseline circuit',
    notify_user: 'Send user notification',
  };

  return descriptions[action];
}

/**
 * Estimate the impact/outcome of an action
 */
function estimateActionImpact(action: AutomationAction): string {
  const impacts: Record<AutomationAction, string> = {
    request_clarification: 'User may provide better input',
    flag_for_review: 'Human expert will review result',
    retry_analysis: 'May improve confidence with fresh run',
    boost_ai_confidence: 'High confidence boost expected',
    suggest_fix: 'User gets actionable recommendations',
    trigger_alert: 'User alerted immediately',
    auto_export: 'Analysis saved in multiple formats',
    auto_simulate: 'Behavior prediction available',
    auto_compare: 'Differences vs reference identified',
    notify_user: 'User stays informed',
  };

  return impacts[action];
}

/**
 * Create automation statistics report
 */
export function generateAutomationStats(logs: AutomationLog[]): AutomationStats {
  const enabledCount = DEFAULT_AUTOMATION_RULES.filter((r) => r.enabled).length;

  const todayLogs = logs.filter((log) => {
    const logDate = new Date(log.triggeredAt);
    const today = new Date();
    return (
      logDate.getFullYear() === today.getFullYear() &&
      logDate.getMonth() === today.getMonth() &&
      logDate.getDate() === today.getDate()
    );
  });

  const totalActions = todayLogs.reduce((sum, log) => sum + log.executedActions.length, 0);
  const successfulActions = todayLogs.reduce(
    (sum, log) => sum + log.executedActions.filter((a) => a.status === 'success').length,
    0,
  );
  const successRate = totalActions > 0 ? successfulActions / totalActions : 1;

  const avgDuration =
    todayLogs.length > 0
      ? todayLogs.reduce((sum, log) => sum + log.totalDurationMs, 0) / todayLogs.length
      : 0;

  // Count by rule
  const ruleExecCounts: Record<string, number> = {};
  todayLogs.forEach((log) => {
    ruleExecCounts[log.ruleId] = (ruleExecCounts[log.ruleId] || 0) + 1;
  });

  const mostTriggeredRule =
    Object.entries(ruleExecCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

  return {
    totalRulesEnabled: enabledCount,
    rulesExecutedToday: todayLogs.length,
    totalActionsExecuted: totalActions,
    successRate,
    averageDurationMs: avgDuration,
    mostTriggeredRule,
    recentLogs: todayLogs.slice(-10),
  };
}

/**
 * Format automation log for display
 */
export function formatAutomationLog(log: AutomationLog): string {
  const actionSummary = log.executedActions
    .map((a) => `${a.action}: ${a.status}${a.durationMs ? ` (${a.durationMs}ms)` : ''}`)
    .join('\n');

  return `
Automation Execution Log
========================
Log ID: ${log.logId}
Rule: ${log.ruleName}
Triggered: ${log.triggeredAt}
Status: ${log.overallStatus}
Total Duration: ${log.totalDurationMs}ms

Actions Executed:
${actionSummary}
  `.trim();
}
