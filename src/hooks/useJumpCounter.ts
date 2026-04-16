import { useRef, useState, useCallback } from 'react';
import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';

/**
 * Jump detection algorithm based on the original app analysis:
 *
 * MediaPipe Pose Landmark indices:
 *   23, 24 = left/right hip
 *   25, 26 = left/right knee
 *   27, 28 = left/right ankle
 *
 * 1. Extract Y-coords of hip, knee, ankle (average left+right)
 * 2. kneeAngle = hipKneeDistance / totalLegLength (normalized ratio)
 * 3. State:
 *    - kneeAngle < 0.3 → 'jumping'
 *    - kneeAngle < 0.45 → 'squatting'
 *    - else → 'standing'
 * 4. Count increments on jumping → standing transition
 * 5. minJumpInterval = 300ms to prevent double-counting
 */

export type JumpState = 'idle' | 'standing' | 'squatting' | 'jumping';

const MIN_JUMP_INTERVAL_MS = 300;
const JUMPING_THRESHOLD = 0.3;
const SQUATTING_THRESHOLD = 0.45;

interface UseJumpCounterReturn {
  count: number;
  state: JumpState;
  confidence: number;
  processPose: (result: PoseLandmarkerResult) => void;
  reset: () => void;
}

export function useJumpCounter(): UseJumpCounterReturn {
  const [count, setCount] = useState(0);
  const [state, setState] = useState<JumpState>('idle');
  const [confidence, setConfidence] = useState(0);

  const prevStateRef = useRef<JumpState>('idle');
  const lastJumpTimeRef = useRef(0);

  const processPose = useCallback((result: PoseLandmarkerResult) => {
    if (!result.landmarks || result.landmarks.length === 0) {
      setConfidence(0);
      return;
    }

    const landmarks = result.landmarks[0];
    if (landmarks.length < 29) return;

    // Extract landmarks (normalized 0-1 coordinates, Y increases downward)
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    // Average visibility as confidence
    const avgVisibility =
      (leftHip.visibility +
        rightHip.visibility +
        leftKnee.visibility +
        rightKnee.visibility +
        leftAnkle.visibility +
        rightAnkle.visibility) /
      6;
    setConfidence(avgVisibility);

    // Skip if pose is not confident enough
    if (avgVisibility < 0.3) return;

    // Average Y positions (normalized, Y increases downward in image space)
    const hipY = (leftHip.y + rightHip.y) / 2;
    const kneeY = (leftKnee.y + rightKnee.y) / 2;
    const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

    // Distance from hip to knee (in normalized coordinates)
    const hipKneeDistance = Math.abs(kneeY - hipY);
    // Total leg length: hip to ankle
    const totalLegLength = Math.abs(ankleY - hipY);

    // Avoid division by zero
    if (totalLegLength < 0.01) return;

    // Knee angle ratio (normalized)
    const kneeAngle = hipKneeDistance / totalLegLength;

    // Determine current state
    let currentState: JumpState;
    if (kneeAngle < JUMPING_THRESHOLD) {
      currentState = 'jumping';
    } else if (kneeAngle < SQUATTING_THRESHOLD) {
      currentState = 'squatting';
    } else {
      currentState = 'standing';
    }

    // Count on jumping → standing transition (landing detected)
    const now = Date.now();
    if (
      prevStateRef.current === 'jumping' &&
      currentState === 'standing' &&
      now - lastJumpTimeRef.current >= MIN_JUMP_INTERVAL_MS
    ) {
      setCount((c) => c + 1);
      lastJumpTimeRef.current = now;
    }

    prevStateRef.current = currentState;
    setState(currentState);
  }, []);

  const reset = useCallback(() => {
    setCount(0);
    setState('idle');
    setConfidence(0);
    prevStateRef.current = 'idle';
    lastJumpTimeRef.current = 0;
  }, []);

  return { count, state, confidence, processPose, reset };
}
