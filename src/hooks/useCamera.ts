import { useRef, useState, useCallback, useEffect } from 'react';

export type CameraFacing = 'user' | 'environment';
export type CameraStatus = 'idle' | 'starting' | 'active' | 'error';

interface UseCameraReturn {
  stream: MediaStream | null;
  status: CameraStatus;
  error: string;
  facing: CameraFacing;
  start: () => Promise<void>;
  stop: () => void;
  toggleFacing: () => void;
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState('');
  const [facing, setFacing] = useState<CameraFacing>('user');

  const streamRef = useRef<MediaStream | null>(null);
  const facingRef = useRef<CameraFacing>('user');

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    setStatus('starting');
    setError('');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingRef.current,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
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
      setStream(null);
    }
  }, []);

  const toggleFacing = useCallback(() => {
    const next = facingRef.current === 'user' ? 'environment' : 'user';
    facingRef.current = next;
    setFacing(next);
    if (streamRef.current) {
      start();
    }
  }, [start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return { stream, status, error, facing, start, stop, toggleFacing };
}
