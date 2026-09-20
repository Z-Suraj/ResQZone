/**
 * Centralized Risk Engine & Threshold Alert Evaluator
 * Evaluates hazard severity, population exposure, safe-zone capacity, and sensor trends.
 * Enforces strict threshold alarm rules: NO automatic sound, red only for CRITICAL, one-time vibration.
 */

import { RiskLevel, VulnerabilityLevel } from '../types';

export interface RiskEvaluationParams {
  hazardSeverity: RiskLevel;
  populationExposure?: number;
  vulnerability?: VulnerabilityLevel;
  routeRisk?: 'SAFE' | 'CAUTION' | 'HIGH_RISK';
  safeZoneCapacityRatio?: number; // 0 to 1
  sensorTrend?: 'ESCALATING' | 'STABLE' | 'DECREASING';
}

export interface RiskEvaluationResult {
  riskLevel: RiskLevel;
  alertType: 'STATUS_NORMAL' | 'ADVISORY' | 'WARNING' | 'EMERGENCY_ALARM';
  message: string;
  badgeText: string;
  badgeColorClass: string;
  requiresEmergencyAttention: boolean;
  canVibrate: boolean;
  recommendedAction: string;
}

class RiskEngine {
  private lastAlertLevel: RiskLevel = 'HIGH';

  public evaluateRisk(params: RiskEvaluationParams): RiskEvaluationResult {
    let score = 0;

    // Hazard severity weights (prototype demo formula)
    if (params.hazardSeverity === 'CRITICAL') score += 50;
    else if (params.hazardSeverity === 'HIGH') score += 35;
    else if (params.hazardSeverity === 'MODERATE') score += 20;
    else score += 5;

    // Sensor trend
    if (params.sensorTrend === 'ESCALATING') score += 25;
    else if (params.sensorTrend === 'DECREASING') score -= 10;

    // Route risk
    if (params.routeRisk === 'HIGH_RISK') score += 15;
    else if (params.routeRisk === 'CAUTION') score += 8;

    // Capacity constraint
    if (params.safeZoneCapacityRatio && params.safeZoneCapacityRatio > 0.9) score += 10;

    let level: RiskLevel = 'SAFE';
    if (score >= 80) level = 'CRITICAL';
    else if (score >= 50) level = 'HIGH';
    else if (score >= 30) level = 'MODERATE';
    else level = 'SAFE';

    // Transition check for vibration
    const isEscalation = (level === 'CRITICAL' || level === 'HIGH') && (this.lastAlertLevel !== level);
    this.lastAlertLevel = level;

    switch (level) {
      case 'CRITICAL':
        return {
          riskLevel: 'CRITICAL',
          alertType: 'EMERGENCY_ALARM',
          message: 'CRITICAL EMERGENCY: Severe flash flood threat. Immediate relocation required.',
          badgeText: 'CRITICAL ALERT',
          badgeColorClass: 'bg-rose-600 text-white border-rose-500 shadow-rose-600/50',
          requiresEmergencyAttention: true,
          canVibrate: isEscalation,
          recommendedAction: 'Evacuate immediately via designated SafeRoute corridor. Seek elevated shelter.',
        };
      case 'HIGH':
        return {
          riskLevel: 'HIGH',
          alertType: 'WARNING',
          message: 'HIGH RISK: Flood risk detected near your area. Monitor alerts and prepare for movement.',
          badgeText: 'HIGH RISK',
          badgeColorClass: 'bg-amber-600 text-white border-amber-500 shadow-amber-600/40',
          requiresEmergencyAttention: false,
          canVibrate: isEscalation,
          recommendedAction: 'Avoid river banks and low-lying areas. Review your Adaptive SafeRoute.',
        };
      case 'MODERATE':
        return {
          riskLevel: 'MODERATE',
          alertType: 'ADVISORY',
          message: 'MODERATE ADVISORY: Elevated river discharge observed. Stay alert for weather advisories.',
          badgeText: 'MODERATE',
          badgeColorClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
          requiresEmergencyAttention: false,
          canVibrate: false,
          recommendedAction: 'Keep emergency contacts handy and monitor local forecasts.',
        };
      case 'SAFE':
      default:
        return {
          riskLevel: 'SAFE',
          alertType: 'STATUS_NORMAL',
          message: 'NORMAL: No active hazard escalation in this sector. Routes are clear.',
          badgeText: 'SAFE ZONE',
          badgeColorClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          requiresEmergencyAttention: false,
          canVibrate: false,
          recommendedAction: 'All regional transit corridors operating normally.',
        };
    }
  }

  /**
   * One-time non-blocking device vibration
   */
  public triggerSafeVibration(level: RiskLevel) {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        if (level === 'CRITICAL') {
          navigator.vibrate([300, 100, 300]);
        } else if (level === 'HIGH') {
          navigator.vibrate([200]);
        }
      } catch {
        // Safe catch if user gesture requirement or unsupported
      }
    }
  }
}

export const riskEngine = new RiskEngine();
