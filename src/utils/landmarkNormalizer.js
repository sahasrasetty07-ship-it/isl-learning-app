/**
 * src/utils/landmarkNormalizer.js
 * Normalizes 21 MediaPipe hand landmarks (wrist-relative translation and hand-size scaling)
 * producing 63 flattened normalized floats [x0, y0, z0, ..., x20, y20, z20].
 */

/**
 * Normalizes an array of 21 landmark objects {x, y, z}.
 * 1. Translates relative to wrist (landmark 0).
 * 2. Scales relative to hand scale (distance from wrist to middle finger MCP landmark 9).
 * 3. Flattens into array of 63 numbers.
 *
 * @param {Array<{ x: number, y: number, z: number }>} landmarks - 21 hand landmarks
 * @returns {number[]} 63 normalized coordinates, or empty array if invalid
 */
export function normalizeHandLandmarks(landmarks) {
  if (!landmarks || !Array.isArray(landmarks) || landmarks.length !== 21) {
    return [];
  }

  const wrist = landmarks[0];
  if (!wrist || typeof wrist.x !== 'number') return [];

  // Translate all landmarks relative to wrist
  const translated = landmarks.map((pt) => ({
    x: pt.x - wrist.x,
    y: pt.y - wrist.y,
    z: (pt.z ?? 0) - (wrist.z ?? 0),
  }));

  // Reference scale: distance between wrist (0) and middle finger MCP (landmark 9)
  const middleMcp = translated[9];
  const distance = Math.hypot(middleMcp.x, middleMcp.y, middleMcp.z);
  const scale = distance > 0.0001 ? 1 / distance : 1;

  // Scale and flatten into 63 floats
  const flattened = [];
  for (let i = 0; i < 21; i++) {
    const pt = translated[i];
    flattened.push(
      Number((pt.x * scale).toFixed(6)),
      Number((pt.y * scale).toFixed(6)),
      Number((pt.z * scale).toFixed(6))
    );
  }

  return flattened;
}

/**
 * Helper to validate if 5 consecutive frame predictions match and meet confidence threshold.
 *
 * @param {Array<{ label: string, confidence: number }>} recentPredictions - buffer of recent predictions
 * @param {number} minConfidence - minimum required confidence (default 0.80)
 * @param {number} requiredStableFrames - required consecutive frames (default 5)
 * @returns {{ isStable: boolean, validatedPrediction: { label: string, confidence: number } | null }}
 */
export function validatePredictionStability(
  recentPredictions = [],
  minConfidence = 0.8,
  requiredStableFrames = 5
) {
  if (!recentPredictions || recentPredictions.length < requiredStableFrames) {
    return { isStable: false, validatedPrediction: null };
  }

  // Look at the last `requiredStableFrames` predictions
  const windowSlice = recentPredictions.slice(-requiredStableFrames);
  const firstLabel = windowSlice[0].label;

  // Check if all frames in the window have the exact same label and meet minConfidence
  const isUniform = windowSlice.every(
    (p) => p && p.label === firstLabel && p.confidence >= minConfidence
  );

  if (!isUniform) {
    return { isStable: false, validatedPrediction: null };
  }

  // Calculate average confidence over the stable window
  const avgConfidence =
    windowSlice.reduce((sum, p) => sum + p.confidence, 0) / requiredStableFrames;

  return {
    isStable: true,
    validatedPrediction: {
      label: firstLabel,
      confidence: Number(avgConfidence.toFixed(4)),
    },
  };
}
