import { useRef, useState, useCallback, useEffect } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

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
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

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

  const detectForVideo = useCallback(
    (video: HTMLVideoElement, timestampMs: number): PoseLandmarkerResult | null => {
      if (!landmarkerRef.current || video.readyState < 2) return null;
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
