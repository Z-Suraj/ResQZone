/**
 * ResQSense Early Warning & Sensor Trend Service
 * Detects pre-critical hazard escalation trends using real-time sensor simulation feeds.
 * Marked as Demo/Prototype Simulation.
 */

import { ResQSenseData, ResQSenseSensor } from '../types';

export const DEFAULT_RESQSENSE_DATA: ResQSenseData = {
  hazardType: 'Riverine Flood',
  currentRiskPct: 82,
  predictedRiskPct: 81,
  trend: 'ESCALATING',
  windowMinutes: 45,
  sensors: [
    { name: 'Rainfall', value: '48.2 mm/hr', delta: '+27%', isEscalating: true, status: 'WARNING' },
    { name: 'River Level', value: '14.8 m', delta: '+18%', isEscalating: true, status: 'CRITICAL' },
    { name: 'Water Flow', value: '3,450 m³/s', delta: '+15%', isEscalating: true, status: 'WARNING' },
    { name: 'Soil Moisture', value: 'Saturated (92%)', delta: 'High', isEscalating: true, status: 'WARNING' },
    { name: 'Temperature', value: '16.4° C', delta: 'Normal', isEscalating: false, status: 'NORMAL' },
  ],
  recommendations: [
    'Alert vulnerable habitations along Alaknanda lower basin',
    'Prepare emergency buses EB-204 and EB-205 for civil shuttling',
    'Check safe-zone capacity at Pipalkoti Sports Complex',
    'Pre-calculate evacuation routes avoiding submerged NH-58 sectors',
    'Position rescue vehicles and NDRF boats at Staging Dock 4',
    'Transmit sensor telemetry to SEOC Dehradun Command Desk'
  ]
};

class ResQSenseService {
  private data: ResQSenseData = { ...DEFAULT_RESQSENSE_DATA };

  public getData(): ResQSenseData {
    return { ...this.data };
  }

  public simulateEscalation(level: 'NORMAL' | 'WARNING' | 'CRITICAL'): ResQSenseData {
    if (level === 'CRITICAL') {
      this.data = {
        ...this.data,
        currentRiskPct: 94,
        predictedRiskPct: 96,
        trend: 'ESCALATING',
        sensors: [
          { name: 'Rainfall', value: '62.0 mm/hr', delta: '+45%', isEscalating: true, status: 'CRITICAL' },
          { name: 'River Level', value: '16.2 m', delta: '+32%', isEscalating: true, status: 'CRITICAL' },
          { name: 'Water Flow', value: '4,800 m³/s', delta: '+28%', isEscalating: true, status: 'CRITICAL' },
          { name: 'Soil Moisture', value: 'Over-Saturated (98%)', delta: 'Severe', isEscalating: true, status: 'CRITICAL' },
          { name: 'Temperature', value: '14.8° C', delta: '-2° C', isEscalating: false, status: 'NORMAL' },
        ]
      };
    } else if (level === 'NORMAL') {
      this.data = {
        ...this.data,
        currentRiskPct: 24,
        predictedRiskPct: 18,
        trend: 'DECREASING',
        sensors: [
          { name: 'Rainfall', value: '4.2 mm/hr', delta: '-12%', isEscalating: false, status: 'NORMAL' },
          { name: 'River Level', value: '8.4 m', delta: '-5%', isEscalating: false, status: 'NORMAL' },
          { name: 'Water Flow', value: '1,120 m³/s', delta: 'Stable', isEscalating: false, status: 'NORMAL' },
          { name: 'Soil Moisture', value: '45%', delta: 'Stable', isEscalating: false, status: 'NORMAL' },
          { name: 'Temperature', value: '18.2° C', delta: 'Normal', isEscalating: false, status: 'NORMAL' },
        ]
      };
    } else {
      this.data = { ...DEFAULT_RESQSENSE_DATA };
    }
    return this.getData();
  }
}

export const resqSenseService = new ResQSenseService();
