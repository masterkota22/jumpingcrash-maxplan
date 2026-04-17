import { useRef, useState, useCallback, useEffect } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

// Pin to match installed @mediapipe/tasks-vision version (see package.json).
// Using "@latest" caused version skew between the JS wrapper and WASM runtime,
// producing noisy / random landmarks.
const MEDIAPIPE_VERSION = '0.10.34';
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

interface UsePoseDetectorReturn {
  modelStatus: ModelStatus;
  modelError: string;
  load: () => Promise<void>;
  detectForVideo: (
    video: HTMLVideoElement,
    timestampMs: number,
  ) => PoseLandmarkerResult | null;
  close: () => void;
}

export function usePoseDetector(): UsePoseDetectorReturn {
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
  const [modelError, setModelError] = useState('');

  const load = useCallback(async () => {
    if (landmarkerRef.current) return;
    setModelStatus('loading');
    setModelError('');

    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      // Try GPU first; fall back to CPU on environments where WebGL/GPU
      // delegate fails silently (some notebooks, strict GPU policies).
      let landmarker: PoseLandmarker;
      try {
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.6,
          minPosePresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
      } catch (gpuErr) {
        console.warn('GPU delegate failed, falling back to CPU:', gpuErr);
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.6,
          minPosePresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
      }

      landmarkerRef.current = landmarker;
      setModelStatus('ready');
    } catch (err) {
      console.error('PoseLandmarker load error:', err);
      setModelError(
        'AI 모델을 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.',
      );
      setModelStatus('error');
    }
  }, []);

  const lastTimestampRef = useRef(0);
  const detectForVideo = useCallback(
    (video: HTMLVideoElement, timestampMs: number): PoseLandmarkerResult | null => {
      if (!landmarkerRef.current || video.readyState < 2) return null;
      // MediaPipe requires strictly monotonically increasing timestamps.
      // Guard against duplicate frames (rAF can fire twice in same ms).
      if (timestampMs <= lastTimestampRef.current) {
        timestampMs = lastTimestampRef.current + 1;
      }
      lastTimestampRef.current = timestampMs;
      try {
        return landmarkerRef.current.detectForVideo(video, timestampMs);
      } catch {
        return null;
      }
    },
    [],
  );

  const close = useCallback(() => {
    if (landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
    }
    lastTimestampRef.current = 0;
    setModelStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  return { modelStatus, modelError, load, detectForVideo, close };
}

export type { PoseLandmarkerResult };
