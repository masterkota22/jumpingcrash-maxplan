import { useRef, useState, useCallback, useEffect } from 'react';

export type CameraFacing = 'user' | 'environment';
export type CameraStatus = 'idle' | 'starting' | 'active' | 'error';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  error: string;
  facing: CameraFacing;
  start: () => Promise<void>;
  stop: () => void;
  toggleFacing: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState('');
  const [facing, setFacing] = useState<CameraFacing>('user');

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    setStatus('starting');
    setError('');

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('active');
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.'
            : '카메라를 시작할 수 없습니다.';
      setError(message);
      setStatus('error');
    }
  }, [facing]);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return { videoRef, status, error, facing, start, stop, toggleFacing };
}
