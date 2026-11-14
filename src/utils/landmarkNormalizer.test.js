import { describe, it, expect } from 'vitest';
import {
  normalizeHandLandmarks,
  validatePredictionStability,
} from './landmarkNormalizer.js';

describe('landmarkNormalizer', () => {
  describe('normalizeHandLandmarks', () => {
    it('returns empty array if landmarks input is invalid or not 21 points', () => {
      expect(normalizeHandLandmarks(null)).toEqual([]);
      expect(normalizeHandLandmarks([])).toEqual([]);
      expect(normalizeHandLandmarks(new Array(10).fill({ x: 0, y: 0, z: 0 }))).toEqual([]);
    });

    it('translates wrist (index 0) to origin (0, 0, 0) and produces 63 numbers', () => {
      // Mock 21 points
      const mockPoints = Array.from({ length: 21 }, (_, i) => ({
        x: 100 + i * 2,
        y: 200 + i * 3,
        z: 50 + i * 1,
      }));

      const normalized = normalizeHandLandmarks(mockPoints);
      expect(normalized).toHaveLength(63);

      // Point 0 (wrist) translated to relative (0, 0, 0)
      expect(normalized[0]).toBe(0);
      expect(normalized[1]).toBe(0);
      expect(normalized[2]).toBe(0);
    });

    it('scales coordinates invariant to hand distance/scale', () => {
      const basePoints = Array.from({ length: 21 }, (_, i) => ({
        x: i * 2,
        y: i * 4,
        z: i * 1,
      }));

      // Double the scale and translate by an offset
      const scaledPoints = basePoints.map((pt) => ({
        x: pt.x * 2 + 50,
        y: pt.y * 2 + 80,
        z: pt.z * 2 + 10,
      }));

      const norm1 = normalizeHandLandmarks(basePoints);
      const norm2 = normalizeHandLandmarks(scaledPoints);

      // Both should produce identical normalized feature values
      expect(norm1).toHaveLength(63);
      expect(norm2).toHaveLength(63);
      for (let i = 0; i < 63; i++) {
        expect(norm1[i]).toBeCloseTo(norm2[i], 4);
      }
    });
  });

  describe('validatePredictionStability', () => {
    it('rejects if fewer than required consecutive frames exist', () => {
      const preds = [
        { label: 'ક', confidence: 0.9 },
        { label: 'ક', confidence: 0.95 },
      ];
      const result = validatePredictionStability(preds, 0.8, 5);
      expect(result.isStable).toBe(false);
      expect(result.validatedPrediction).toBeNull();
    });

    it('rejects if confidence drops below threshold in any frame', () => {
      const preds = [
        { label: 'ક', confidence: 0.9 },
        { label: 'ક', confidence: 0.85 },
        { label: 'ક', confidence: 0.75 }, // below 0.80
        { label: 'ક', confidence: 0.9 },
        { label: 'ક', confidence: 0.88 },
      ];
      const result = validatePredictionStability(preds, 0.8, 5);
      expect(result.isStable).toBe(false);
    });

    it('rejects if label changes within the 5-frame window', () => {
      const preds = [
        { label: 'ક', confidence: 0.9 },
        { label: 'ક', confidence: 0.88 },
        { label: 'ખ', confidence: 0.91 }, // label mismatch
        { label: 'ક', confidence: 0.9 },
        { label: 'ક', confidence: 0.89 },
      ];
      const result = validatePredictionStability(preds, 0.8, 5);
      expect(result.isStable).toBe(false);
    });

    it('validates prediction when stable for 5 consecutive frames above 0.80', () => {
      const preds = [
        { label: 'ક', confidence: 0.82 },
        { label: 'ક', confidence: 0.88 },
        { label: 'ક', confidence: 0.91 },
        { label: 'ક', confidence: 0.85 },
        { label: 'ક', confidence: 0.89 },
      ];
      const result = validatePredictionStability(preds, 0.8, 5);
      expect(result.isStable).toBe(true);
      expect(result.validatedPrediction.label).toBe('ક');
      expect(result.validatedPrediction.confidence).toBeGreaterThanOrEqual(0.85);
    });
  });
});
